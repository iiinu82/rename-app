const processAndSetFiles = (fileList, setFiles) => {
  fileList.sort((a, b) => {
    return a.originalName.localeCompare(b.originalName, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  setFiles(fileList);
};

// フォルダを選択してファイル名を取り込む処理（ボタン用）
export const handleSelectFolder = async (setFiles) => {
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
    processAndSetFiles(fileList, setFiles);
  } catch (err) {
    console.error(
      "フォルダの選択がキャンセルされたか、エラーが発生しました",
      err,
    );
  }
};

// 📥 ドラッグ＆ドロップされたときの処理
export const handleDrop = async (e, setIsDraggingOver, setFiles) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDraggingOver(false);

  try {
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const fileList = [];

    for (const item of items) {
      if (item.getAsFileSystemHandle) {
        const handle = await item.getAsFileSystemHandle();

        if (handle.kind === "directory") {
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
      processAndSetFiles(fileList, setFiles);
    } else {
      alert("有効なファイルまたはフォルダが見つかりませんでした。");
    }
  } catch (err) {
    console.error("ドロップ処理中にエラーが発生しました", err);
    alert("ファイルの読み込みに失敗しました。");
  }
};

// ↗️ ドラッグオーバー時の処理
export const handleDragOver = (e, setIsDraggingOver) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDraggingOver(true);
};

// ↘️ ドラッグリーブ時の処理
export const handleDragLeave = (e, setIsDraggingOver) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDraggingOver(false);
};
