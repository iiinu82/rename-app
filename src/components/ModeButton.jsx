function ModeButton({ mode, setActiveMode, activeMode, children }) {
  return (
    <button
      onClick={() => setActiveMode(mode)}
      className="modeTabBtn"
      style={{
        backgroundColor: activeMode === mode ? "#0070f3" : "#e0e0e0",
        color: activeMode === mode ? "#fff" : "#333",
      }}
    >
      {children}
    </button>
  );
}

export default ModeButton;
