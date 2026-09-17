export function renderAppIcon(canvas: number) {
  const outer = Math.round(canvas * 0.586);
  const outerBorder = Math.round(canvas * 0.0547);
  const inner = Math.round(canvas * 0.332);
  const innerBorder = Math.round(canvas * 0.0469);
  const dot = Math.round(canvas * 0.125);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: "50%",
          border: `${outerBorder}px solid #34d399`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: "50%",
            border: `${innerBorder}px solid #34d399`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#34d399" }} />
        </div>
      </div>
    </div>
  );
}
