// ファイル名の一部をリアルタイムにハイライト表示するコンポーネント
function HighlightedFileName({
  targetName,
  startPos,
  endPos,
  activeMode,
  insertPos,
  isChecked,
  swapStart1,
  swapEnd1,
  swapStart2,
  swapEnd2,
}) {
  if (!isChecked) {
    return <span>{targetName}</span>;
  }
  const dotIndex = targetName.lastIndexOf(".");
  const baseName = dotIndex !== -1 ? targetName.slice(0, dotIndex) : targetName;
  const extension = dotIndex !== -1 ? targetName.slice(dotIndex) : "";

  // 1. 置換モードのハイライト
  if (activeMode === "replace") {
    const start = parseInt(startPos, 10);
    const end = parseInt(endPos, 10);

    if (
      isNaN(start) ||
      isNaN(end) ||
      start <= 0 ||
      end < start ||
      start > baseName.length
    ) {
      return <span>{targetName}</span>;
    }

    const part1 = baseName.slice(0, start - 1);
    const part2 = baseName.slice(start - 1, end);
    const part3 = baseName.slice(end);

    return (
      <span>
        {part1}
        <span className="highlightPart">{part2}</span>
        {part3}
        <span className="extensionPart">{extension}</span>
      </span>
    );
  }

  // 2. 挿入モードのハイライト
  if (activeMode === "insert") {
    const pos = parseInt(insertPos, 10);
    if (isNaN(pos) || pos < 0 || pos > baseName.length) {
      return <span>{targetName}</span>;
    }

    const part1 = baseName.slice(0, pos - 1);
    const part2 = baseName.slice(pos - 1);

    return (
      <span>
        {part1}
        <span className="insertHighlightLine"></span>
        {part2}
        <span className="extensionPart">{extension}</span>
      </span>
    );
  }
  // 3. 交換モードのハイライト（2箇所を別々の色でハイライト）
  if (activeMode === "change") {
    const s1 = parseInt(swapStart1, 10);
    const e1 = parseInt(swapEnd1, 10);
    const s2 = parseInt(swapStart2, 10);
    const e2 = parseInt(swapEnd2, 10);

    // バリデーション（数値が入っていない、または範囲がおかしい場合はそのまま返す）
    if (
      isNaN(s1) ||
      isNaN(e1) ||
      s1 <= 0 ||
      e1 < s1 ||
      s1 > baseName.length ||
      isNaN(s2) ||
      isNaN(e2) ||
      s2 <= 0 ||
      e2 < s2 ||
      s2 > baseName.length
    ) {
      return <span>{targetName}</span>;
    }

    // 重複チェック
    if (e1 >= s2) {
      return <span className="changeCheckAlert">※範囲が重複しています</span>;
    }

    // 5つに分割して組み立てる（前1, 塊1, 中間, 塊2, 後2）
    const p1 = baseName.slice(0, s1 - 1);
    const target1 = baseName.slice(s1 - 1, e1);
    const p2 = baseName.slice(e1, s2 - 1);
    const target2 = baseName.slice(s2 - 1, e2);
    const p3 = baseName.slice(e2);

    return (
      <span>
        {p1}
        {/* 第1のハイライト */}
        <span className="changeHighlight1">{target1}</span>
        {p2}
        {/* 第2のハイライト */}
        <span className="changeHighlight2">{target2}</span>
        {p3}
        <span className="extensionPart">{extension}</span>
      </span>
    );
  }

  return <span>{targetName}</span>;
}

export default HighlightedFileName;
