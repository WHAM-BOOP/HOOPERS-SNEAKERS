import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type CatalogFiltersProps = {
  action: string;
  categories: FilterOption[];
  brands: FilterOption[];
  sizes: FilterOption[];
  current: {
    q?: string;
    category?: string;
    brand?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
  className?: string;
};

const SORT_OPTIONS: FilterOption[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

/**
 * Catalog filters as a real GET form: progressive enhancement, bookmarkable
 * URLs, full keyboard support. No client JS required to filter.
 */
export function CatalogFilters({
  action,
  categories,
  brands,
  sizes,
  current,
  className,
}: CatalogFiltersProps) {
  return (
    <form
      method="get"
      action={action}
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-5 rounded-md border border-line bg-surface p-5 lg:grid-cols-6",
        className,
      )}
      aria-label="Filter products"
    >
      <div className="col-span-2 lg:col-span-2">
        <label htmlFor="filter-q" className="label">
          Search
        </label>
        <input
          id="filter-q"
          type="search"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="Search shoes, brands…"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="filter-category" className="label">
          Category
        </label>
        <select
          id="filter-category"
          name="category"
          defaultValue={current.category ?? ""}
          className="input"
        >
          <option value="">All</option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-brand" className="label">
          Brand
        </label>
        <select
          id="filter-brand"
          name="brand"
          defaultValue={current.brand ?? ""}
          className="input"
        >
          <option value="">All</option>
          {brands.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-size" className="label">
          Size (US)
        </label>
        <select
          id="filter-size"
          name="size"
          defaultValue={current.size ?? ""}
          className="input"
        >
          <option value="">All</option>
          {sizes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-sort" className="label">
          Sort by
        </label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={current.sort ?? "featured"}
          className="input"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex flex-wrap items-end gap-3 lg:col-span-4">
        <div className="flex-1 min-w-32">
          <label htmlFor="filter-min" className="label">
            Min price ($)
          </label>
          <input
            id="filter-min"
            type="number"
            name="minPrice"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={current.minPrice ?? ""}
            placeholder="0"
            className="input"
          />
        </div>
        <div className="flex-1 min-w-32">
          <label htmlFor="filter-max" className="label">
            Max price ($)
          </label>
          <input
            id="filter-max"
            type="number"
            name="maxPrice"
            min={0}
            step={1}
            inputMode="numeric"
            defaultValue={current.maxPrice ?? ""}
            placeholder="250"
            className="input"
          />
        </div>
      </div>

      <div className="col-span-2 flex items-end gap-3 lg:col-span-2">
        <button type="submit" className="btn-primary flex-1">
          Apply filters
        </button>
        <a
          href={action}
          className="btn-outline"
          aria-label="Clear all filters"
        >
          Clear
        </a>
      </div>
    </form>
  );
}
