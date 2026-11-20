import { useId, useRef, useState } from "react"

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
}: Props) {
  const [search, setSearch] = useState("")
  const [showHidden, setShowHidden] = useState(false)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [tagsOpen, setTagsOpen] = useState(false)
  const [tagQuery, setTagQuery] = useState("")
  const tagContainerRef = useRef<HTMLDivElement>(null)
  const tagSearchRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const optionId = (index: number) => `${listboxId}-option-${index}`
  const filteredTags = allTags

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
              placeholder="Search tags"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              className={`${controlClass} w-full`}
            />
            <div
              id={listboxId}
              role="listbox"
              aria-label="Tags"
              aria-multiselectable="true"
              className="mt-2 max-h-60 overflow-y-auto"
            >
              {filteredTags.map((tag, index) => (
                <div
                  key={tag}
                  id={optionId(index)}
                  role="option"
                  className="rounded-md px-2 py-1.5 text-sm text-slate-700"
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
