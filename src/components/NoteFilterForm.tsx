import { useState } from "react"

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

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <label
            key={tag}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-200"
          >
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => handleTagToggle(tag)}
              className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
            />
            {tag}
          </label>
        ))}
      </div>
    </section>
  )
}
