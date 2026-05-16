type Props = {
  title: string;
  lead?: string;
};

export function PageHeader({ title, lead }: Props) {
  return (
    <header className="mb-8">
      <h1 className="page-title">{title}</h1>
      {lead ? <p className="page-lead">{lead}</p> : null}
    </header>
  );
}
