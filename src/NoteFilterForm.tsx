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
      params.set("_sort", "createdAt")
      params.set("_order", value)
    })
  }

  const handleTagToggle = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onTagsChange(next)
  }

  return (
    <div>
      Filters
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={handleSearchChange}
      />
      <label>
        <input
          type="checkbox"
          checked={showHidden}
          onChange={handleShowHiddenChange}
        />
        Show Hidden
      </label>
      <select value={sortOrder} onChange={handleSortChange}>
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>
      <div>
        {allTags.map((tag) => (
          <label key={tag}>
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => handleTagToggle(tag)}
            />
            {tag}
          </label>
        ))}
      </div>
    </div>
  )
}