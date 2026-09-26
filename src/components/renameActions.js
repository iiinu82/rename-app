// 🔄 仮リネーム処理
export const handleTemporaryRename = ({
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
}) => {
  if (files.length === 0) return;

  const targetNamesMap = files.map((file, index) => {
    if (!file.isChecked) {
      return file.currentName;
    }
    // 自分より前にあるチェックONの数を数える
    const validIndex = files.slice(0, index).filter((f) => f.isChecked).length;
    return file.customName || generateNewName(file.currentName, validIndex);
  });

  // 重複チェック：更新後のすべてのファイル名を集めて、重複がないかチェックする
  const nameSet = new Set();
  for (const name of targetNamesMap) {
    // プレビュー上の名前（拡張子込み）

    if (nameSet.has(name)) {
      // すでに同じ名前がセットの中に存在していれば重複エラー！
      alert(
        `【エラー】「${name}」という名前が複数のファイルで重複しています。\n同じ名前のファイルを作ることはできないため、仮リネームを中断しました。`,
      );
      return; // 処理をここで完全にストップし、ステートも更新させない
    }
    nameSet.add(name);
  }
  const updatedFiles = files.map((file, index) => {
    if (!file.isChecked) {
      return file;
    }
    return {
      ...file,
      currentName: targetNamesMap[index],
      customName: "",
    };
  });

  updatedFiles.sort((a, b) => {
    return a.currentName.localeCompare(b.currentName, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  setFiles(updatedFiles);

  setStartPos("");
  setEndPos("1");
  setReplaceStr("");
  setInsertPos("");
  setInsertStr("");
  setInsertNum("");
  setInsertNumPos("");
  setStartNum("1");
  setDigitCount("2");
  setSwapStart1("");
  setSwapEnd1("1");
  setSwapStart2("");
  setSwapEnd2("1");
};

// 実際にパソコン内のファイル名を一括で書き換える処理
export const handleRenameExecute = async ({
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
}) => {
  if (files.length === 0) return;

  const finalNamesList = files.map((file, index) => {
    let finalName = file.currentName;
    if (file.isChecked) {
      const validIndex = files
        .slice(0, index)
        .filter((f) => f.isChecked).length;
      finalName =
        file.customName || generateNewName(file.currentName, validIndex);
    }
    return finalName;
  });

  // リストの中に全く同じ名前が複数ないかを厳重にチェックする
  const nameSet = new Set();
  for (const name of finalNamesList) {
    if (nameSet.has(name)) {
      alert(
        `【エラー】リネーム後の名前に「${name}」が重複しています。\n同じ名前のファイルを作成することはできないため、処理を中断しました。`,
      );
      return;
    }
    nameSet.add(name);
  }

  // 確認ダイアログを表示
  const isConfirmed = window.confirm(
    "本当に一括リネームを実行しますか？\n(※チェックの入っていないファイルも変更後のファイル名に変更されます)",
  );
  if (!isConfirmed) return;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const finalName = finalNamesList[i];

      if (file.originalName !== finalName) {
        await file.handle.move(finalName);
      }
    }

    alert("すべてのファイルのリネームが完了しました！");

    // すべてのステートをきれいに初期化
    setFiles([]);
    setStartPos("");
    setEndPos("1");
    setReplaceStr("");
    setInsertPos("");
    setInsertStr("");
    setInsertNum("");
    setInsertNumPos("");
    setStartNum("1");
    setDigitCount("2");
    setSwapStart1("");
    setSwapEnd1("1");
    setSwapStart2("");
    setSwapEnd2("1");
  } catch (err) {
    console.error("リネーム処理中にエラーが発生しました", err);
    alert("エラーが発生しました。フォルダへの書き込み権限を確認してください。");
  }
};
