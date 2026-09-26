// ファイル名の一部をリアルタイムにハイライト表示するコンポーネント
function HighlightedFileName({
  targetName,
  protectExtension,
  startPos,
  endPos,
  activeMode,
  insertPos,
  insertNumPos,
  isChecked,
  swapStart1,
  swapEnd1,
  swapStart2,
  swapEnd2,
}) {
  if (!isChecked) {
    return <span>{targetName}</span>;
  }

  let baseName = targetName;
  let extension = "";

  if (protectExtension) {
    const dotIndex = targetName.lastIndexOf(".");
    baseName = dotIndex !== -1 ? targetName.slice(0, dotIndex) : targetName;
    extension = dotIndex !== -1 ? targetName.slice(dotIndex) : "";
  }

  // 1. 置換モードのハイライト
  if (activeMode === "replace") {
    const start = parseInt(startPos, 10);
    const count = parseInt(endPos, 10);

    if (isNaN(start) || isNaN(count) || start <= 0 || start > baseName.length) {
      return <span>{targetName}</span>;
    }
    const startIndex = start - 1;
    const endIndex = startIndex + count;

    const part1 = baseName.slice(0, startIndex);
    const part2 = baseName.slice(startIndex, endIndex);
    const part3 = baseName.slice(endIndex);

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
    if (isNaN(pos) || pos < 0 || pos - 1 > baseName.length) {
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

  // 3. 連番挿入モードのハイライト
  if (activeMode === "insertNum") {
    const pos = parseInt(insertNumPos, 10);

    if (isNaN(pos) || pos < 0 || pos - 1 > baseName.length) {
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
  // 4. 交換モードのハイライト（2箇所を別々の色でハイライト）
  if (activeMode === "change") {
    const s1 = parseInt(swapStart1, 10);
    const c1 = parseInt(swapEnd1, 10);
    const s2 = parseInt(swapStart2, 10);
    const c2 = parseInt(swapEnd2, 10);

    // バリデーション（数値が入っていない、または範囲がおかしい場合はそのまま返す）
    if (
      isNaN(s1) ||
      isNaN(c1) ||
      s1 <= 0 ||
      c1 < 0 ||
      s1 > baseName.length ||
      isNaN(s2) ||
      isNaN(c2) ||
      s2 <= 0 ||
      c2 < 0 ||
      s2 > baseName.length
    ) {
      return <span>{targetName}</span>;
    }
    const startIndex1 = s1 - 1;
    const endIndex1 = startIndex1 + c1;

    const startIndex2 = s2 - 1;
    const endIndex2 = startIndex2 + c2;

    // 💡 重複チェック（前半の終わりが、後半の始まりを超えていたらアラートを出す）
    if (endIndex1 > startIndex2) {
      return <span className="changeCheckAlert">※範囲が重複しています</span>;
    }
    // 文字数がファイル全体の長さを超える場合もガード
    if (endIndex2 > baseName.length) {
      return <span>{targetName}</span>;
    }

    // 5つに分割して組み立てる（前1, 塊1, 中間, 塊2, 後2）
    const p1 = baseName.slice(0, startIndex1);
    const target1 = baseName.slice(startIndex1, endIndex1);
    const p2 = baseName.slice(endIndex1, startIndex2);
    const target2 = baseName.slice(startIndex2, endIndex2);
    const p3 = baseName.slice(endIndex2);

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
