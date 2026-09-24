import { useState } from "react";
import "./App.css";
import ModeButton from "./components/ModeButton";
import HighlightedFileName from "./components/HighlightedFileName";
import {
  handleTemporaryRename,
  handleRenameExecute,
} from "./components/renameActions";
import {
  handleSelectFolder,
  handleDrop,
  handleDragOver,
  handleDragLeave,
} from "./components/handleFolder";

export default function App() {
  const [files, setFiles] = useState([]);
  const [activeMode, setActiveMode] = useState("replace");

  const [startPos, setStartPos] = useState("");
  const [endPos, setEndPos] = useState("");
  const [replaceStr, setReplaceStr] = useState("");

  const [insertPos, setInsertPos] = useState("");
  const [insertStr, setInsertStr] = useState("");

  const [swapStart1, setSwapStart1] = useState("");
  const [swapEnd1, setSwapEnd1] = useState("");
  const [swapStart2, setSwapStart2] = useState("");
  const [swapEnd2, setSwapEnd2] = useState("");

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 🔄 一括変換ルールに基づいて「新しい名前」をリアルタイム計算する関数
  const generateNewName = (baseTargetName) => {
    // 各モードのガード（何も入力されていなければそのまま返す）
    if (activeMode === "replace" && !startPos && !endPos && !replaceStr) {
      return baseTargetName;
    }
    if (activeMode === "insert" && !insertPos && !insertStr) {
      return baseTargetName;
    }
    if (
      activeMode === "change" &&
      (!swapStart1 || !swapEnd1 || !swapStart2 || !swapEnd2)
    ) {
      return baseTargetName;
    }

    const dotIndex = baseTargetName.lastIndexOf(".");
    let baseName =
      dotIndex !== -1 ? baseTargetName.slice(0, dotIndex) : baseTargetName;
    const extension = dotIndex !== -1 ? baseTargetName.slice(dotIndex) : "";

    // 1. 置換モード
    if (activeMode === "replace") {
      const start = parseInt(startPos, 10);
      const end = parseInt(endPos, 10);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        const before = baseName.slice(0, start - 1);
        const after = baseName.slice(end);
        baseName = before + replaceStr + after;
      }
    }
    // 2. 挿入モード
    else if (activeMode === "insert") {
      const pos = parseInt(insertPos, 10);
      if (!isNaN(pos) && pos >= 0 && pos <= baseName.length + 1) {
        const before = baseName.slice(0, pos - 1);
        const after = baseName.slice(pos - 1);
        baseName = before + insertStr + after;
      }
    }
    // 3. ★ 新機能：交換モード (change)
    else if (activeMode === "change") {
      const s1 = parseInt(swapStart1, 10);
      const e1 = parseInt(swapEnd1, 10);
      const s2 = parseInt(swapStart2, 10);
      const e2 = parseInt(swapEnd2, 10);

      // バリデーション ＆ 範囲の重複チェック（第1の終わりが第2の始まり以上なら何もしない）
      if (
        !isNaN(s1) &&
        !isNaN(e1) &&
        s1 > 0 &&
        e1 >= s1 &&
        s1 <= baseName.length &&
        !isNaN(s2) &&
        !isNaN(e2) &&
        s2 > 0 &&
        e2 >= s2 &&
        s2 <= baseName.length &&
        e1 < s2
      ) {
        const p1 = baseName.slice(0, s1 - 1);
        const target1 = baseName.slice(s1 - 1, e1); // 1つ目の塊
        const p2 = baseName.slice(e1, s2 - 1); // 間の文字
        const target2 = baseName.slice(s2 - 1, e2); // 2つ目の塊
        const p3 = baseName.slice(e2); // 後ろの残り

        // ★ 順番を入れ替えて結合する（target1 と target2 をスワップ！）
        baseName = p1 + target2 + p2 + target1 + p3;
      }
    }

    return baseName + extension;
  };

  // すべてのチェックをON/OFF切り替えるトグル関数
  const handleToggleAllCheck = () => {
    const allChecked = files.every((file) => file.isChecked);
    const updatedFiles = files.map((file) => ({
      ...file,
      isChecked: !allChecked,
    }));
    setFiles(updatedFiles);
  };

  // 入力した文字数のバリデーション(入力したデータ,setする関数)
  const handleNumberChange = (e, setterFunction) => {
    const val = e.target.value;

    // ① 空文字は許可する
    if (val === "") {
      setterFunction("");
      return;
    }

    const num = parseInt(val, 10);

    // ② 1未満（0やマイナス）または数字でなければ弾く
    if (isNaN(num) || num < 1) {
      return;
    }

    // ③ 1以上ならセットする
    setterFunction(num.toString());
  };

  return (
    <div className="renameContainer">
      <div className="titleArea">
        <h1 className="renameTitle">一括リネームツール</h1>
        <p>ファイル整理を圧倒的に効率化する一括リネームツール</p>
      </div>
      <div className="secondArea">
        {files.length !== 0 ? (
          <button
            className="selectFolderBtn"
            onClick={() => handleSelectFolder(setFiles)}
            style={{ marginBottom: "20px" }}
          >
            別のフォルダを選択し直す
          </button>
        ) : (
          ""
        )}
        <div className="descArea">
          <p className="rename-desc">
            ※ファイルはサーバーにアップロードされず、あなたのブラウザ内だけで安全に処理されます。
          </p>
          <p className="rename-desc">
            ※ブラウザによってはフォルダが選択出来ない場合があります。ChromeやEdgeでお試し下さい。
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div
          className={`drop-zone ${isDraggingOver ? "drag-over" : ""}`}
          onDragOver={(e) => handleDragOver(e, setIsDraggingOver)}
          onDragLeave={(e) => handleDragLeave(e, setIsDraggingOver)}
          onDrop={(e) => handleDrop(e, setIsDraggingOver, setFiles)}
        >
          <div className="drop-zone-content">
            <p className="drop-zone-text">ここにフォルダをドロップ</p>
            <span className="drop-zone-subtext">または</span>
            <button
              className="selectFolderBtn"
              onClick={() => handleSelectFolder(setFiles)}
            >
              📂 フォルダを選択する
            </button>
          </div>
        </div>
      ) : (
        ""
      )}

      {files.length > 0 && (
        <>
          {/* 一括変換コントロールパネル */}
          <div className="controlPanel">
            <div className="topArea">
              {/* モード切替タブ */}
              <div className="modeTabs">
                <ModeButton
                  activeMode={activeMode}
                  setActiveMode={setActiveMode}
                  mode="replace"
                  children
                >
                  置換
                </ModeButton>
                <ModeButton
                  activeMode={activeMode}
                  setActiveMode={setActiveMode}
                  mode="insert"
                  children
                >
                  文字挿入
                </ModeButton>
                <ModeButton
                  activeMode={activeMode}
                  setActiveMode={setActiveMode}
                  mode="change"
                  children
                >
                  交換
                </ModeButton>
              </div>

              {/* 仮リネームボタン */}
              <div className="tempRenameBtnArea">
                <span className="tempRenameBtnDesc">
                  ※1工程終わるごとに押して下さい（まだリネームはされません）→
                </span>
                <button
                  onClick={() =>
                    handleTemporaryRename({
                      files,
                      setFiles,
                      generateNewName,
                      setStartPos,
                      setEndPos,
                      setReplaceStr,
                      setInsertPos,
                      setInsertStr,
                      setSwapStart1,
                      setSwapEnd1,
                      setSwapStart2,
                      setSwapEnd2,
                    })
                  }
                  className="tempRenameBtn"
                  title="現在のプレビュー結果を次のベース名として確定し、入力をリセットします"
                >
                  変更を一旦保存する
                </button>
              </div>
            </div>

            {/* モード1: 置換モードの入力エリア */}
            {activeMode === "replace" && (
              <div className="ruleRow">
                <input
                  type="number"
                  className="posInput"
                  value={startPos}
                  onChange={(e) => handleNumberChange(e, setStartPos)}
                  placeholder="1"
                />
                <span>文字目 から </span>
                <input
                  type="number"
                  className="posInput"
                  value={endPos}
                  onChange={(e) => handleNumberChange(e, setEndPos)}
                  placeholder="2"
                />
                <span>文字目を、</span>
                <input
                  type="text"
                  className="replaceInput"
                  value={replaceStr}
                  onChange={(e) => setReplaceStr(e.target.value)}
                  placeholder="✕✕"
                />
                <span>に変える（空欄で削除）</span>
              </div>
            )}

            {/* モード2: 挿入モードの入力エリア */}
            {activeMode === "insert" && (
              <div className="rule-row">
                <input
                  type="number"
                  className="posInput"
                  value={insertPos}
                  onChange={(e) => handleNumberChange(e, setInsertPos)}
                  placeholder="0"
                  min="1"
                  step="1"
                />
                <span>文字目の前に、</span>
                <input
                  type="text"
                  className="replaceInput"
                  value={insertStr}
                  onChange={(e) => setInsertStr(e.target.value)}
                  placeholder="追加する文字"
                />
                <span>を挿入する</span>
              </div>
            )}
            {/* 📋 モード3: 交換モードの入力エリア (change) */}
            {activeMode === "change" && (
              <div className="ruleRow">
                <span>左から</span>
                <input
                  type="number"
                  className="posInput changeInput1"
                  value={swapStart1}
                  onChange={(e) => handleNumberChange(e, setSwapStart1)}
                  placeholder="1"
                />
                <span>文字目 から </span>
                <input
                  type="number"
                  className="posInput changeInput1"
                  value={swapEnd1}
                  onChange={(e) => handleNumberChange(e, setSwapEnd1)}
                  placeholder="2"
                />
                <span>文字目 と、</span>
                <span>左から</span>
                <input
                  type="number"
                  className="posInput changeInput2"
                  value={swapStart2}
                  onChange={(e) => handleNumberChange(e, setSwapStart2)}
                  placeholder="5"
                />
                <span>文字目 から </span>
                <input
                  type="number"
                  className="posInput changeInput2"
                  value={swapEnd2}
                  onChange={(e) => handleNumberChange(e, setSwapEnd2)}
                  placeholder="6"
                />
                <span>文字目を入れ替える</span>
              </div>
            )}
          </div>

          {/* 📋 プレビューリスト */}
          <div className="previewHeader">
            <div className="previewCol">
              <span>現在のファイル名（変更対象）</span>
              {/* ★ すべてのチェックを切り替えるボタン */}
              <button onClick={handleToggleAllCheck} className="toggleCheckBtn">
                {files.every((f) => f.isChecked) ? "すべて解除" : "すべて選択"}
              </button>
            </div>
            <div className="previewCol">
              変更後のファイル名（手動で微調整も可能）
            </div>
          </div>

          <div className="previewListArea">
            {files.map((file, index) => {
              const currentPreview = !file.isChecked
                ? file.currentName
                : file.customName || generateNewName(file.currentName);
              return (
                <div
                  key={index}
                  className="previewRow"
                  style={{ opacity: file.isChecked ? 1 : 0.7 }} // チェック外れたら少し薄くする
                >
                  {/* 左：チェックボックス ＋ リアルタイムハイライト */}
                  <div className="previewCell originalCell">
                    <input
                      type="checkbox"
                      checked={file.isChecked}
                      onChange={(e) => {
                        const newFiles = [...files];
                        newFiles[index].isChecked = e.target.checked;
                        setFiles(newFiles);
                      }}
                    />
                    <HighlightedFileName
                      targetName={file.currentName}
                      startPos={startPos}
                      endPos={endPos}
                      activeMode={activeMode}
                      insertPos={insertPos}
                      isChecked={file.isChecked}
                      swapStart1={swapStart1}
                      swapEnd1={swapEnd1}
                      swapStart2={swapStart2}
                      swapEnd2={swapEnd2}
                    />
                  </div>
                  {/* 右：変更後の入力フォーム */}
                  <div className="previewCell edit-cell">
                    <input
                      type="text"
                      className="editInput"
                      value={currentPreview}
                      disabled={!file.isChecked}
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
          <button
            className="executeBtn"
            onClick={() =>
              handleRenameExecute({
                files,
                setFiles,
                generateNewName,
                setStartPos,
                setEndPos,
                setReplaceStr,
                setInsertPos,
                setInsertStr,
                setSwapStart1,
                setSwapEnd1,
                setSwapStart2,
                setSwapEnd2,
              })
            }
          >
            この内容で一括リネームを実行する
          </button>
        </>
      )}
    </div>
  );
}
