const style = {
  container: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    alignItems: "stretch",
    width: "100%",
    maxWidth: "420px",
    margin: "0 auto",
  },
  badge: {
    display: "flex",
    flex: "1 1 0",
    minWidth: 0,
    minHeight: "44px",
    borderRadius: "40px",
    backgroundColor: "#F3F3F3CC",
    color: "black",
    alignItems: "center",
    justifyContent: "center",
    margin: "8px 0px",
    padding: "8px 6px",
    fontSize: "14px",
    lineHeight: 1.2,
    border: "none",
  },
};

const STATUS_STYLE: Record<FilterStatus, React.CSSProperties> = {
  all: {
    backgroundColor: "#000000",
    color: "white",
  },
  owned: {
    backgroundColor: "#58AB64CC",
    color: "white",
  },
  not: {
    backgroundColor: "#FFB877CC",
    color: "white",
  },
};

// コンポーネント表示用
/**
 * { label: "すべて", value: "all" },
 */
type Option = {
  label: string;
  value: FilterStatus;
};

// 切り替え用の型定義
export type FilterStatus = "all" | "owned" | "not";

export default function SegmentedControl({
  status, // 現在の状態
  options, // UI表示を行うもの
  onChange, // クリック時
}: {
  status: FilterStatus;
  options: Option[];
  onChange: (v: FilterStatus) => void;
}) {
  return (
    <>
      <div style={style.container}>
        {options.map((o) => {
          return (
            <button
              type="button"
              aria-pressed={status === o.value}
              style={{
                ...style.badge,
                ...(status === o.value ? STATUS_STYLE[o.value] : {}),
              }}
              key={o.value}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
