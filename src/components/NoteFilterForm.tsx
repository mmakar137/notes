import { useEffect, useId, useRef, useState } from "react"

interface Props {
  onFilterChange: (
    filter: string,
    fn: (params: URLSearchParams) => void
  ) => void
  allTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function NoteFilterForm({
  onFilterChange,
  allTags,
  selectedTags,
  onTagsChange,
}: Props) {
  const [search, setSearch] = useState("")
  const [showHidden, setShowHidden] = useState(false)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [tagsOpen, setTagsOpen] = useState(false)
  const [tagQuery, setTagQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const tagContainerRef = useRef<HTMLDivElement>(null)
  const tagTriggerRef = useRef<HTMLButtonElement>(null)
  const tagSearchRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-option-${index}`
  const query = tagQuery.trim().toLowerCase()
  const filteredTags = query
    ? allTags.filter((tag) => tag.toLowerCase().includes(query))
    : allTags
  const activeOptionIndex =
    activeIndex >= 0 && activeIndex < filteredTags.length ? activeIndex : -1

  useEffect(() => {
    if (!tagsOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!tagContainerRef.current?.contains(event.target as Node)) {
        setTagsOpen(false)
        setTagQuery("")
        setActiveIndex(-1)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [tagsOpen])

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setSearch(value)
    onFilterChange("search", (params) => {
      const trimmed = value.trim()
      if (trimmed) {
        params.set("title:contains", trimmed)
      }
    })
  }

  const handleShowHiddenChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked
    setShowHidden(checked)
    onFilterChange("showHidden", (params) => {
      if (!checked) {
        params.set("hidden", "false")
      }
    })
  }

  const handleSortChange = (
  e: React.ChangeEvent<HTMLSelectElement>
) => {
  const value = e.target.value as "desc" | "asc"
  setSortOrder(value)
  onFilterChange("sort", (params) => {
    params.set("_sort", value === "desc" ? "-createdAt" : "createdAt")
  })
}

  const handleTagToggle = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onTagsChange(next)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" || e.key === "Tab") {
      setTagsOpen(false)
      setTagQuery("")
      setActiveIndex(-1)
      if (e.key === "Escape") {
        e.preventDefault()
        tagTriggerRef.current?.focus()
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filteredTags.length - 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const tag = filteredTags[activeOptionIndex]
      if (tag) handleTagToggle(tag)
    }
  }

  const controlClass =
    "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors duration-150 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
        Filters
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={handleSearchChange}
          className={controlClass}
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={handleShowHiddenChange}
            className="h-4 w-4 cursor-pointer accent-blue-600"
          />
          Show Hidden
        </label>
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className={controlClass}
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      <div ref={tagContainerRef} className="relative w-64">
        <button
          ref={tagTriggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={tagsOpen}
          aria-controls={listboxId}
          disabled={allTags.length === 0}
          onClick={() => setTagsOpen((open) => !open)}
          className={`${controlClass} flex cursor-pointer items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span>Tags</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {selectedTags.length === 0
              ? "All"
              : `${selectedTags.length} selected`}
          </span>
          <span aria-hidden="true">▾</span>
        </button>

        {tagsOpen && allTags.length > 0 && (
          <div className="absolute z-10 mt-2 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            <input
              ref={tagSearchRef}
              autoFocus
              type="text"
              aria-label="Search tags"
              aria-controls={listboxId}
              aria-activedescendant={
                activeOptionIndex >= 0 ? optionId(activeOptionIndex) : undefined
              }
              placeholder="Search tags"
              value={tagQuery}
              onChange={(e) => {
                setTagQuery(e.target.value)
                setActiveIndex(-1)
              }}
              onKeyDown={handleTagKeyDown}
              className={`${controlClass} w-full`}
            />
            <div
              id={listboxId}
              role="listbox"
              aria-label="Tags"
              aria-multiselectable="true"
              className="mt-2 max-h-60 overflow-y-auto"
            >
              {filteredTags.map((tag, index) => {
                const selected = selectedTags.includes(tag)
                return (
                  <div
                    key={tag}
                    id={optionId(index)}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleTagToggle(tag)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-slate-100 ${
                      index === activeOptionIndex ? "bg-blue-50" : ""
                    } ${
                      selected
                        ? "font-medium text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    <span aria-hidden="true" className="w-3">
                      {selected ? "✓" : ""}
                    </span>
                    {tag}
                  </div>
                )
              })}
              {filteredTags.length === 0 && allTags.length > 0 && (
                <p className="px-2 py-3 text-sm text-slate-500">
                  No tags found
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
