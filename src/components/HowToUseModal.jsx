import React from "react";
// 必要であればモーダル用のCSSをインポートしてください

export default function HowToUseModal({ isOpen, onClose }) {
  // isOpenがfalseなら何も表示しない（閉じている状態）
  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="howToUseContent">
        <h2 className="howToUseTitle">使い方ガイド</h2>
        <p className="howToUseDesc">
          安全にご使用するため、事前に変更するファイルのバックアップを取っておいて下さい。
        </p>
        <ol className="howToUseOl">
          <li>
            変更する📄ファイル（複数可）を既存または作成した📁フォルダに入れます。
          </li>
          <li>
            『📁フォルダを選択ボタン』を押すか、📁フォルダを画面上のエリアにドロップしてフォルダを選択します。
            <br />
            <span className="red">※</span>
            この時にポップアップでファイルの表示とコピーの許可を求められることがあります。OKで先に進みます。
          </li>
          <li>
            変換のモードを選び、ルールを入力するとチェックの入ったファイルが一括で変更されます。
            <br />
            もしくは右側「変更後のファイル名」の入力欄で個別に直接変更します。
          </li>
          <li>
            さらに別のモードで変更を加えたい時は、『変更を一旦保存する』ボタンを押して、変更を左側の「現在のファイル名」に反映させてください。
            <br />
            <span className="red">※</span>
            この時点では、まだ実際のファイルのファイル名は更新されません。
          </li>
          <li>
            すべての変更が終了しましたら、右側の「変更後のファイル名」を確認の上、『この内容で一括リネームを実行する』ボタンを押して下さい。
            <br />
            <span className="red">※</span>
            チェックが入っている、入っていないに関わらず全てのファイルが「変更後のファイル名」に書き換えられます。
          </li>
          <li>確認のポップアップでOKを押すとリネームが実行されます。</li>
        </ol>
        <button onClick={onClose} className="closeBtn">
          閉じる
        </button>
      </div>
    </div>
  );
}
