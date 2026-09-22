import { useEffect, useState } from "react";
import "./App.css";

// 🌟 ファイル名の一部をリアルタイムにハイライト表示するコンポーネント
function HighlightedFileName({
  targetName,
  startPos,
  endPos,
  activeMode,
  insertPos,
  isChecked,
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
        <span className="highlight-part">{part2}</span>
        {part3}
        <span className="extension-part">{extension}</span>
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
        <span className="insert-highlight-line"></span>
        {part2}
        <span className="extension-part">{extension}</span>
      </span>
    );
  }

  return <span>{targetName}</span>;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [activeMode, setActiveMode] = useState("replace");

  const [startPos, setStartPos] = useState("");
  const [endPos, setEndPos] = useState("");
  const [replaceStr, setReplaceStr] = useState("");

  const [insertPos, setInsertPos] = useState("");
  const [insertStr, setInsertStr] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processAndSetFiles = (fileList) => {
    fileList.sort((a, b) => {
      return a.originalName.localeCompare(b.originalName, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
    setFiles(fileList);
  };

  // 📁 フォルダを選択してファイル名を取り込む処理（自然順ソート ＆ デフォルトでチェックON）
  const handleSelectFolder = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      const fileList = [];
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === "file") {
          fileList.push({
            handle: entry,
            originalName: entry.name,
            currentName: entry.name,
            customName: "",
            isChecked: true,
          });
        }
      }

      processAndSetFiles(fileList);
    } catch (err) {
      console.error(
        "フォルダの選択がキャンセルされたか、エラーが発生しました",
        err,
      );
    }
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    try {
      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const fileList = [];

      // ドロップされたアイテム（フォルダまたはファイル）を走査
      for (const item of items) {
        // File System Access API の Handle を取得
        if (item.getAsFileSystemHandle) {
          const handle = await item.getAsFileSystemHandle();

          if (handle.kind === "directory") {
            // フォルダがドロップされた場合：中のファイルをすべて読み込む
            for await (const entry of handle.values()) {
              if (entry.kind === "file") {
                fileList.push({
                  handle: entry,
                  originalName: entry.name,
                  currentName: entry.name,
                  customName: "",
                  isChecked: true,
                });
              }
            }
          } else if (handle.kind === "file") {
            // ファイルが直接ドロップされた場合（複数対応）
            fileList.push({
              handle: handle,
              originalName: handle.name,
              currentName: handle.name,
              customName: "",
              isChecked: true,
            });
          }
        }
      }

      if (fileList.length > 0) {
        processAndSetFiles(fileList);
      } else {
        alert("有効なファイルまたはフォルダが見つかりませんでした。");
      }
    } catch (err) {
      console.error("ドロップ処理中にエラーが発生しました", err);
      alert("ファイルの読み込みに失敗しました。");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  // 🔄 一括変換ルールに基づいて「新しい名前」をリアルタイム計算する関数
  const generateNewName = (baseTargetName) => {
    // ★ ガード：置換も挿入も何もルールが入力されていなければ、何もしずそのままの名前を返す！
    if (activeMode === "replace" && !startPos && !endPos && !replaceStr) {
      return baseTargetName;
    }
    if (activeMode === "insert" && !insertPos && !insertStr) {
      return baseTargetName;
    }

    const dotIndex = baseTargetName.lastIndexOf(".");
    let baseName =
      dotIndex !== -1 ? baseTargetName.slice(0, dotIndex) : baseTargetName;
    const extension = dotIndex !== -1 ? baseTargetName.slice(dotIndex) : "";

    if (activeMode === "replace") {
      const start = parseInt(startPos, 10);
      const end = parseInt(endPos, 10);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        const before = baseName.slice(0, start - 1);
        const after = baseName.slice(end);
        baseName = before + replaceStr + after;
      }
    } else if (activeMode === "insert") {
      const pos = parseInt(insertPos, 10);
      if (!isNaN(pos) && pos >= 0 && pos <= baseName.length + 1) {
        const before = baseName.slice(0, pos - 1);
        const after = baseName.slice(pos - 1);
        baseName = before + insertStr + after;
      }
    }

    return baseName + extension;
  };

  // 🔄 仮リネーム処理（チェックが入っているファイルだけ対象にする）
  const handleTemporaryRename = () => {
    if (files.length === 0) return;

    const updatedFiles = files.map((file) => {
      // ★ チェックが外れているファイルは、仮リネームの対象外として一切変更せずそのまま返す！
      if (!file.isChecked) {
        return file;
      }

      // チェックが入っているファイルだけ、現在のプレビュー結果を次のベース名に昇格させる
      const currentPreview =
        file.customName || generateNewName(file.currentName);
      return {
        ...file,
        currentName: currentPreview,
        customName: "", // カスタム入力はクリア
      };
    });

    updatedFiles.sort((a, b) => {
      return a.currentName.localeCompare(b.currentName, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    setFiles(updatedFiles);
    // 入力ルールをリセット
    setStartPos("");
    setEndPos("");
    setReplaceStr("");
    setInsertPos("");
    setInsertStr("");
  };

  // 🎛️ すべてのチェックをON/OFF切り替えるトグル関数
  const handleToggleAllCheck = () => {
    // すべてチェックされているか判定し、されていれば全解除、そうでなければ全選択にする
    const allChecked = files.every((file) => file.isChecked);
    const updatedFiles = files.map((file) => ({
      ...file,
      isChecked: !allChecked,
    }));
    setFiles(updatedFiles);
  };

  // 💾 実際にパソコン内のファイル名を一括で書き換える処理（チェックされたファイルのみ）
  const handleRenameExecute = async () => {
    if (files.length === 0) return;

    try {
      for (const file of files) {
        // ★ 修正ポイント：
        // もしチェックが外れているファイルなら、一括ルールやカスタム入力を一切無視して、
        // 「現在の currentName（これまでに仮リネームで確定した名前）」をそのまま最終名にする！
        let finalName = file.currentName;

        if (file.isChecked) {
          // チェックが入っているファイルだけ、カスタム名または現在のルールを適用した名前にする
          finalName = file.customName || generateNewName(file.currentName);
        }

        // 最初の名前（originalName）と違う場合のみ、パソコン内の実ファイルを移動する
        if (file.originalName !== finalName) {
          await file.handle.move(finalName);
        }
      }
      alert("すべてのファイルのリネームが完了しました！");
      setFiles([]);
    } catch (err) {
      console.error("リネーム処理中にエラーが発生しました", err);
      alert(
        "エラーが発生しました。フォルダへの書き込み権限を確認してください。",
      );
    }
  };

  return (
    <div className="rename-container">
      <div className="titleArea">
        <h1 className="rename-title">一括リネームツール</h1>
        <p>ファイル整理を圧倒的に効率化する一括リネームツール</p>
      </div>
      <p className="rename-desc">
        ※ファイルはサーバーにアップロードされず、あなたのブラウザ内だけで安全に処理されます。
      </p>

      {files.length === 0 ? (
        <div
          className={`drop-zone ${isDraggingOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <p className="drop-zone-text">ここにフォルダをドロップ</p>
            <span className="drop-zone-subtext">または</span>
            <button className="select-folder-btn" onClick={handleSelectFolder}>
              📂 フォルダを選択する
            </button>
          </div>
        </div>
      ) : (
        // ファイルが読み込まれた後は、コンパクトなボタンや再選択用に上部に残すこともできます
        <button
          className="select-folder-btn"
          onClick={handleSelectFolder}
          style={{ marginBottom: "20px" }}
        >
          📂 別のフォルダを選択し直す
        </button>
      )}

      {files.length > 0 && (
        <>
          {/* ⚙️ 一括変換コントロールパネル */}
          <div className="control-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              {/* 🎛️ モード切替タブ */}
              <div className="mode-tabs">
                <button
                  onClick={() => setActiveMode("replace")}
                  className="mode-tab-btn"
                  style={{
                    backgroundColor:
                      activeMode === "replace" ? "#0070f3" : "#e0e0e0",
                    color: activeMode === "replace" ? "#fff" : "#333",
                  }}
                >
                  置換
                </button>
                <button
                  onClick={() => setActiveMode("insert")}
                  className="mode-tab-btn"
                  style={{
                    backgroundColor:
                      activeMode === "insert" ? "#0070f3" : "#e0e0e0",
                    color: activeMode === "insert" ? "#fff" : "#333",
                  }}
                >
                  文字挿入
                </button>
              </div>

              {/* 仮リネームボタン */}
              <button
                onClick={handleTemporaryRename}
                className="temp-rename-btn"
                title="現在のプレビュー結果を次のベース名として確定し、入力をリセットします"
              >
                🔄 仮リネーム（次へ）
              </button>
            </div>

            {/* 📋 モード1: 置換モードの入力エリア */}
            {activeMode === "replace" && (
              <div className="rule-row">
                <input
                  type="number"
                  className="pos-input"
                  value={startPos}
                  onChange={(e) => setStartPos(e.target.value)}
                  placeholder="1"
                />
                <span>文字目 から </span>
                <input
                  type="number"
                  className="pos-input"
                  value={endPos}
                  onChange={(e) => setEndPos(e.target.value)}
                  placeholder="2"
                />
                <span>文字目を、</span>
                <input
                  type="text"
                  className="replace-input"
                  value={replaceStr}
                  onChange={(e) => setReplaceStr(e.target.value)}
                  placeholder="✕✕"
                />
                <span>に変える（空欄で削除）</span>
              </div>
            )}

            {/* 📋 モード2: 挿入モードの入力エリア */}
            {activeMode === "insert" && (
              <div className="rule-row">
                <input
                  type="number"
                  className="pos-input"
                  value={insertPos}
                  onChange={(e) => setInsertPos(e.target.value)}
                  placeholder="0"
                />
                <span>文字目の前に、</span>
                <input
                  type="text"
                  className="replace-input"
                  value={insertStr}
                  onChange={(e) => setInsertStr(e.target.value)}
                  placeholder="追加する文字"
                />
                <span>を挿入する</span>
              </div>
            )}
          </div>

          {/* 📋 プレビューリスト */}
          <div className="preview-header">
            <div
              className="preview-col"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span>現在のファイル名（変更対象）</span>
              {/* ★ すべてのチェックを切り替えるボタン */}
              <button
                onClick={handleToggleAllCheck}
                style={{
                  padding: "2px 8px",
                  fontSize: "12px",
                  backgroundColor: "#e2e8f0",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {files.every((f) => f.isChecked) ? "すべて解除" : "すべて選択"}
              </button>
            </div>
            <div className="preview-col">
              変更後のファイル名（手動で微調整も可能）
            </div>
          </div>

          <div className="preview-list-area">
            {files.map((file, index) => {
              const currentPreview = !file.isChecked
                ? file.currentName
                : file.customName || generateNewName(file.currentName);
              return (
                <div
                  key={index}
                  className="preview-row"
                  style={{ opacity: file.isChecked ? 1 : 0.4 }} // チェック外れたら少し薄くする親切設計
                >
                  {/* 左：チェックボックス ＋ リアルタイムハイライト */}
                  <div
                    className="preview-cell original-cell"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={file.isChecked}
                      onChange={(e) => {
                        const newFiles = [...files];
                        newFiles[index].isChecked = e.target.checked;
                        setFiles(newFiles);
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <HighlightedFileName
                      targetName={file.currentName}
                      startPos={startPos}
                      endPos={endPos}
                      activeMode={activeMode}
                      insertPos={insertPos}
                      isChecked={file.isChecked}
                    />
                  </div>
                  {/* 右：変更後の入力フォーム */}
                  <div className="preview-cell edit-cell">
                    <input
                      type="text"
                      className="edit-input"
                      value={currentPreview}
                      disabled={!file.isChecked} // チェック外れたら入力も無効化する
                      onChange={(e) => {
                        const newFiles = [...files];
                        newFiles[index].customName = e.target.value;
                        setFiles(newFiles);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🚀 実行ボタン */}
          <button className="execute-btn" onClick={handleRenameExecute}>
            ⚡ この内容で一括リネームを実行する（やり直し不可）
          </button>
        </>
      )}
    </div>
  );
}
