interface LoadingProps {
  label: string
}

export const Loading = ({ label }: LoadingProps) => (
  <div className="loading" role="status">
    <p>{label}</p>
    <div className="loading__rows" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </div>
)
