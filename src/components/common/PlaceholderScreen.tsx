import React from "react";

interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export default function PlaceholderScreen({
  title,
  description,
}: PlaceholderScreenProps): React.ReactElement {
  return (
    <div style={{ padding: "24px 0" }}>
      <h2
        style={{
          margin: "0 0 8px",
          fontFamily: "Georgia, serif",
          color: "#123936",
        }}
      >
        {title}
      </h2>
      <p style={{ margin: 0, color: "#687573", fontSize: 14 }}>
        {description ?? "This screen is coming soon."}
      </p>
    </div>
  );
}
