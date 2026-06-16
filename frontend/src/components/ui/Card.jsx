export default function Card({ children, className = "", padding = "p-5", as: Tag = "div", ...rest }) {
  return (
    <Tag className={`bg-surface border border-border rounded-xl shadow-sm ${padding} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}