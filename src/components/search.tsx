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
    <form className="row" method="get" style={{ margin: "18px 0" }}>
      <input
        aria-label="Rechercher"
        placeholder={placeholder}
        name="q"
        defaultValue={query}
        style={{ flex: 1, minWidth: 180 }}
      />
      {children}
      <button className="secondary">Rechercher</button>
    </form>
  );
}
