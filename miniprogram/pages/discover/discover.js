import {
  createNote,
  createNoteItem,
  createNoteShareCode,
  deleteNoteItem,
  getNoteItems,
  getNotes,
  updateNoteItem
} from '../../api/index'
import { toast } from '../../utils/extendApi'

const NOTE_PAGE_SIZE = 100
const ITEM_PAGE_SIZE = 10
const SHARE_EXPIRE_SECONDS = 24 * 60 * 60
const SHARE_MAX_USES = 20

const pad = (num) => String(num).padStart(2, '0')

const toTimestamp = (value) => {
  if (!value) return 0
  const ts = Date.parse(value)
  return Number.isNaN(ts) ? 0 : ts
}

const formatDateTime = (value) => {
  const ts = typeof value === 'number' ? value : toTimestamp(value)
  if (!ts) return '--'
  const date = new Date(ts)
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  return `${month}-${day} ${hour}:${minute}`
}

const getMonthKey = (ts) => {
  if (!ts) return 'unknown'
  const date = new Date(ts)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

const getMonthLabel = (ts) => {
  if (!ts) return '未知月份'
  const date = new Date(ts)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

const normalizeUser = (user = {}) => {
  return {
    id: user?.id || '',
    name: String(user?.name || '').trim() || '未知成员',
    avatar: String(user?.avatar || '').trim()
  }
}

const normalizeNote = (note = {}) => {
  const createdAt = note?.createdAt || note?.updatedAt || ''
  const updatedAt = note?.updatedAt || note?.createdAt || ''
  const createdAtTs = toTimestamp(createdAt)
  const updatedAtTs = toTimestamp(updatedAt)
  return {
    id: note?.id || '',
    title: String(note?.title || '').trim() || '未命名笔记',
    lineTotal: Number(note?.itemCount ?? note?.lineTotal ?? 0),
    memberCount: Number(note?.memberCount || 0),
    createdAt,
    updatedAt,
    createdAtTs,
    updatedAtTs
  }
}

const sortNotesByCreatedAtDesc = (notes = []) => {
  return notes.slice().sort((a, b) => b.createdAtTs - a.createdAtTs)
}

const normalizeItem = (item = {}) => {
  const updatedAt = item?.updatedAt || item?.createdAt || ''
  const createdAt = item?.createdAt || item?.updatedAt || ''
  const updatedAtTs = toTimestamp(updatedAt)
  const updatedBy = normalizeUser(item?.updatedBy || item?.createdBy || {})
  return {
    id: item?.id || '',
    noteId: item?.noteId || '',
    content: String(item?.content || '').trim(),
    createdAt,
    updatedAt,
    updatedAtTs,
    updatedBy,
    updatedByName: updatedBy.name,
    updatedText: formatDateTime(updatedAt)
  }
}

const groupLinesByMonth = (lines = []) => {
  const sections = []
  const monthMap = {}
  lines.forEach((line) => {
    const monthKey = getMonthKey(line.updatedAtTs)
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        monthKey,
        monthLabel: getMonthLabel(line.updatedAtTs),
        items: []
      }
      sections.push(monthMap[monthKey])
    }
    monthMap[monthKey].items.push(line)
  })
  return sections
}

const mergeUniqueItems = (list = []) => {
  const map = {}
  const result = []
  list.forEach((item) => {
    const id = item?.id
    if (!id || map[id]) return
    map[id] = true
    result.push(item)
  })
  return result
}

Page({
  data: {
    notes: [],
    activeNoteId: '',
    activeNoteTitle: '',
    activeNoteLineTotal: 0,
    lineSections: [],
    shareCode: '',
    shareExpireText: '',
    shareNoteTitle: '',
    showSharePopup: false,
    loadingNotes: false,
    loadingMore: false,
    hasMore: false
  },
  onLoad() {
    this.itemsPage = 0
    this.itemsTotal = 0
    this.loadedItems = []
    this.initPage()
  },
  onReachBottom() {
    this.loadMoreLines()
  },
  async initPage() {
    const activeNoteId = await this.fetchNotes(this.data.activeNoteId)
    if (!activeNoteId) {
      this.clearItems()
      return
    }
    await this.loadMoreLines(true)
  },
  async fetchNotes(preferredNoteId = '') {
    this.setData({ loadingNotes: true })
    try {
      const data = await getNotes({ page: 1, pageSize: NOTE_PAGE_SIZE, order: 'desc' })
      const noteList = Array.isArray(data?.list) ? data.list : []
      const notes = sortNotesByCreatedAtDesc(noteList.map(normalizeNote))
      const activeNoteId = preferredNoteId && notes.some((note) => note.id === preferredNoteId)
        ? preferredNoteId
        : (notes[0]?.id || '')
      this.setData({
        notes,
        activeNoteId
      })
      this.syncActiveNoteProfile(notes)
      return activeNoteId
    } catch (error) {
      this.setData({
        notes: [],
        activeNoteId: ''
      })
      this.syncActiveNoteProfile([])
      toast({ title: '加载笔记失败', icon: 'none' })
      return ''
    } finally {
      this.setData({ loadingNotes: false })
    }
  },
  syncActiveNoteProfile(notes = this.data.notes) {
    const active = (notes || []).find((item) => item.id === this.data.activeNoteId)
    this.setData({
      activeNoteTitle: active?.title || '',
      activeNoteLineTotal: Number(active?.lineTotal || 0)
    })
  },
  clearItems() {
    this.itemsPage = 0
    this.itemsTotal = 0
    this.loadedItems = []
    this.setData({
      lineSections: [],
      hasMore: false,
      loadingMore: false,
      showSharePopup: false
    })
  },
  async loadMoreLines(reset = false) {
    const noteId = this.data.activeNoteId
    if (!noteId) return
    if (this.data.loadingMore) return
    if (!reset && !this.data.hasMore) return

    const nextPage = reset ? 1 : this.itemsPage + 1
    this.setData({ loadingMore: true })
    try {
      const data = await getNoteItems(noteId, {
        page: nextPage,
        pageSize: ITEM_PAGE_SIZE,
        order: 'desc'
      })
      const pageList = (Array.isArray(data?.list) ? data.list : []).map(normalizeItem)
      const merged = reset ? pageList : [...this.loadedItems, ...pageList]
      const uniqueList = mergeUniqueItems(merged).sort((a, b) => b.updatedAtTs - a.updatedAtTs)
      const total = Number(data?.total || 0)

      this.loadedItems = uniqueList
      this.itemsPage = Number(data?.page || nextPage)
      this.itemsTotal = total || uniqueList.length

      this.setData({
        lineSections: groupLinesByMonth(uniqueList),
        hasMore: uniqueList.length < this.itemsTotal,
        loadingMore: false
      })
    } catch (error) {
      if (reset) {
        this.clearItems()
      }
      this.setData({ loadingMore: false })
      toast({ title: '加载条目失败', icon: 'none' })
    }
  },
  async onSelectNote(e) {
    const noteId = e.currentTarget.dataset.id
    if (!noteId || noteId === this.data.activeNoteId) return
    this.setData({ activeNoteId: noteId, showSharePopup: false })
    this.syncActiveNoteProfile()
    this.clearItems()
    await this.loadMoreLines(true)
  },
  onCreateNote() {
    wx.showModal({
      title: '新建笔记',
      editable: true,
      placeholderText: '例如：出行清单',
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const title = String(content || '').trim() || `新笔记 ${this.data.notes.length + 1}`
        try {
          const data = await createNote({ title })
          const note = normalizeNote(data || {})
          if (!note.id) {
            await this.initPage()
            return
          }
          const notes = sortNotesByCreatedAtDesc([note, ...(this.data.notes || [])])
          this.setData({
            notes,
            activeNoteId: note.id,
            showSharePopup: false
          })
          this.syncActiveNoteProfile(notes)
          this.clearItems()
          await this.loadMoreLines(true)
          toast({ title: '笔记已创建', icon: 'success' })
        } catch (error) {
          toast({ title: '创建笔记失败', icon: 'none' })
        }
      }
    })
  },
  onAddLine() {
    const noteId = this.data.activeNoteId
    if (!noteId) return
    wx.showModal({
      title: '新增记录',
      editable: true,
      placeholderText: '输入这一行的内容',
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const text = String(content || '').trim()
        if (!text) {
          toast({ title: '内容不能为空', icon: 'none' })
          return
        }
        try {
          await createNoteItem(noteId, { content: text })
          await this.refreshAfterItemChange(noteId)
        } catch (error) {
          toast({ title: '新增记录失败', icon: 'none' })
        }
      }
    })
  },
  onEditLine(e) {
    const lineId = e.currentTarget.dataset.id
    const noteId = this.data.activeNoteId
    if (!lineId || !noteId) return
    const target = (this.loadedItems || []).find((line) => line.id === lineId)
    if (!target) return

    wx.showModal({
      title: '编辑记录',
      editable: true,
      placeholderText: target.content,
      success: async ({ confirm, content }) => {
        if (!confirm) return
        const nextContent = String(content || '').trim() || target.content
        if (nextContent === target.content) return
        try {
          await updateNoteItem(noteId, lineId, { content: nextContent })
          await this.refreshAfterItemChange(noteId)
        } catch (error) {
          toast({ title: '编辑记录失败', icon: 'none' })
        }
      }
    })
  },
  onDeleteLine(e) {
    const lineId = e.currentTarget.dataset.id
    const noteId = this.data.activeNoteId
    if (!lineId || !noteId) return

    wx.showModal({
      title: '删除记录',
      content: '确认删除这条记录吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          await deleteNoteItem(noteId, lineId)
          await this.refreshAfterItemChange(noteId)
        } catch (error) {
          toast({ title: '删除记录失败', icon: 'none' })
        }
      }
    })
  },
  async refreshAfterItemChange(noteId) {
    await this.fetchNotes(noteId)
    this.clearItems()
    await this.loadMoreLines(true)
  },
  async onGenerateShareCode() {
    const noteId = this.data.activeNoteId
    const noteTitle = this.data.activeNoteTitle
    if (!noteId) {
      toast({ title: '请先选择笔记', icon: 'none' })
      return
    }
    try {
      const data = await createNoteShareCode(noteId, {
        expiresIn: SHARE_EXPIRE_SECONDS,
        maxUses: SHARE_MAX_USES
      })
      const shareCode = String(data?.shareCode || '').trim()
      if (!shareCode) {
        toast({ title: '生成分享码失败', icon: 'none' })
        return
      }
      this.setData({
        shareCode,
        shareExpireText: formatDateTime(data?.expireAt),
        shareNoteTitle: noteTitle,
        showSharePopup: true
      })
    } catch (error) {
      toast({ title: '生成分享码失败', icon: 'none' })
    }
  },
  onCopyShareCode() {
    if (!this.data.shareCode) return
    wx.setClipboardData({
      data: this.data.shareCode,
      success: () => {
        toast({ title: '分享码已复制', icon: 'success' })
      }
    })
  },
  onPopupTap() {},
  onCloseSharePopup() {
    this.setData({ showSharePopup: false })
  }
})
