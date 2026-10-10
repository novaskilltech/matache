import { Search as SearchIcon } from "lucide-react";
export function Search({
  query = "",
  placeholder = "Client, téléphone, ville, date ou action…",
  children,
}: {
  query?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <form className="search-form" method="get">
      <div className="search-input">
        <SearchIcon size={19} aria-hidden="true" />
        <input
          aria-label="Rechercher"
          placeholder={placeholder}
          name="q"
          defaultValue={query}
        />
      </div>
      {children}
      <button className="secondary">Rechercher</button>
    </form>
  );
}
