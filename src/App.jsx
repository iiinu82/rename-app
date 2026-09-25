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
  const [endPos, setEndPos] = useState("1");
  const [replaceStr, setReplaceStr] = useState("");

  const [insertPos, setInsertPos] = useState("");
  const [insertStr, setInsertStr] = useState("");

  const [insertNumPos, setInsertNumPos] = useState("");
  const [insertNum, setInsertNum] = useState("");
  const [startNum, setStartNum] = useState("");
  const [digitCount, setDigitCount] = useState("2");

  const [swapStart1, setSwapStart1] = useState("");
  const [swapEnd1, setSwapEnd1] = useState("1");
  const [swapStart2, setSwapStart2] = useState("");
  const [swapEnd2, setSwapEnd2] = useState("1");

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 🔄 一括変換ルールに基づいて「新しい名前」をリアルタイム計算する関数
  const generateNewName = (baseTargetName, validIndex = 0) => {
    // 各モードのガード（何も入力されていなければそのまま返す）
    if (activeMode === "replace" && !startPos && !endPos && !replaceStr) {
      return baseTargetName;
    }
    if (activeMode === "insert" && !insertPos && !insertStr) {
      return baseTargetName;
    }
    if (activeMode === "insertNum" && !insertNumPos && !insertNum) {
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
      const count = parseInt(endPos, 10);
      if (!isNaN(start) && !isNaN(count) && start > 0) {
        const startIndex = start - 1;
        const endIndex = startIndex + count;
        const before = baseName.slice(0, startIndex);
        const after = baseName.slice(endIndex);
        baseName = before + replaceStr + after;
      }
    }
    // 2. 文字挿入モード
    else if (activeMode === "insert") {
      const pos = parseInt(insertPos, 10);
      if (!isNaN(pos) && pos >= 0 && pos <= baseName.length + 1) {
        const before = baseName.slice(0, pos - 1);
        const after = baseName.slice(pos - 1);
        baseName = before + insertStr + after;
      }
    }

    // 3. 連番挿入モード
    else if (activeMode === "insertNum") {
      const pos = parseInt(insertNumPos, 10);
      if (!isNaN(pos) && pos >= 0 && pos <= baseName.length + 1) {
        const before = baseName.slice(0, pos - 1);
        const after = baseName.slice(pos - 1);

        // 🔢 連番文字列をここでリアルタイム計算
        const start = parseInt(startNum, 10) || 1; // 開始番号（無効なら1番から）
        const digits = parseInt(digitCount, 10) || 1; // 桁数（無効なら1桁）
        const currentNum = start + validIndex;
        // 指定の桁数でゼロ埋め（例：01, 002 など）
        const generatedNumberStr = String(currentNum).padStart(digits, "0");
        baseName = before + generatedNumberStr + after;
      }
    }

    // 4. 交換モード
    else if (activeMode === "change") {
      const s1 = parseInt(swapStart1, 10);
      const c1 = parseInt(swapEnd1, 10);
      const s2 = parseInt(swapStart2, 10);
      const c2 = parseInt(swapEnd2, 10);

      // バリデーション ＆ 範囲の重複チェック（第1の終わりが第2の始まり以上なら何もしない）
      if (
        !isNaN(s1) &&
        !isNaN(c1) &&
        s1 > 0 &&
        c1 >= 0 &&
        !isNaN(s2) &&
        !isNaN(c2) &&
        s2 > 0 &&
        c2 >= 0
      ) {
        const startIndex1 = s1 - 1;
        const endIndex1 = startIndex1 + c1; // 1つ目の塊の終わり位置

        const startIndex2 = s2 - 1;
        const endIndex2 = startIndex2 + c2; // 2つ目の塊の終わり位置

        if (endIndex1 <= startIndex2 && endIndex2 <= baseName.length) {
          const p1 = baseName.slice(0, startIndex1);
          const target1 = baseName.slice(startIndex1, endIndex1); // 1つ目の塊
          const p2 = baseName.slice(endIndex1, startIndex2); // 間の文字
          const target2 = baseName.slice(startIndex2, endIndex2); // 2つ目の塊
          const p3 = baseName.slice(endIndex2); // 後ろの残り

          // ★ 順番を入れ替えて結合する（target1 と target2 をスワップ！）
          baseName = p1 + target2 + p2 + target1 + p3;
        }
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

  // ----------------------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <div className="renameContainer">
      <div className="titleArea">
        <h1 className="renameTitle">一括リネームツール</h1>
        <p>複数のファイル名を一気に変更する</p>
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
                  mode="insertNum"
                  children
                >
                  連番挿入
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
                  ※ひと工程が終わるごとに押して下さい（まだリネームはされません）→
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
                      setInsertNum,
                      setInsertNumPos,
                      setStartNum,
                      setDigitCount,
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
                  placeholder="3"
                />
                <span>文字分を、</span>
                <input
                  type="text"
                  className="replaceInput"
                  value={replaceStr}
                  onChange={(e) => setReplaceStr(e.target.value)}
                  placeholder="置き換える文字"
                />
                <span>に変える（空欄で削除）</span>
              </div>
            )}

            {/* モード2: 挿入モードの入力エリア */}
            {activeMode === "insert" && (
              <div className="ruleRow">
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

            {/* モード3: 連番挿入モードの入力エリア */}
            {activeMode === "insertNum" && (
              <div className="ruleRow">
                <input
                  type="number"
                  className="posInput"
                  value={insertNumPos}
                  onChange={(e) => handleNumberChange(e, setInsertNumPos)}
                  placeholder="0"
                  min="1"
                  step="1"
                />
                <span>文字目の前に連番を挿入する。</span>
                <span>最初の番号</span>
                <input
                  type="number"
                  className="posInput"
                  value={startNum}
                  onChange={(e) => setStartNum(e.target.value)}
                  placeholder="1"
                  min="1"
                  step="1"
                />
                <span>から、</span>
                <input
                  type="number"
                  className="posInput"
                  value={digitCount}
                  onChange={(e) => setDigitCount(e.target.value)}
                  placeholder="2"
                  min="1"
                  step="1"
                />
                <span>桁で挿入する。</span>
              </div>
            )}

            {/* モード4: 交換モードの入力エリア*/}
            {activeMode === "change" && (
              <div className="ruleRow">
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
                <span>文字分 と、</span>
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
                <span>文字分を入れ替える</span>
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
              const validIndex = files
                .slice(0, index)
                .filter((f) => f.isChecked).length;
              const currentPreview = !file.isChecked
                ? file.currentName
                : file.customName ||
                  generateNewName(file.currentName, validIndex);
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
                      insertNumPos={insertNumPos}
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
                setInsertNum,
                setInsertNumPos,
                setStartNum,
                setDigitCount,
                setSwapStart1,
                setSwapEnd1,
                setSwapStart2,
                setSwapEnd2,
              })
            }
          >
            この内容で一括リネームを実行する
          </button>

          <footer>© 2026 T.Kawakatsu All Rights Reserved.</footer>
        </>
      )}
    </div>
  );
}
