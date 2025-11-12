# 目標
設計書を作成しやすくするための、文字ベースの設計書作成補助ツールを作成する
# 開発環境
- Javascript
- HTML + CSS
    - シングルページアプリ
    - サイドバー
    - インポート / エクスポート ボタン
# GEMINIに求める条件
- 日本語で受け答え
# 入出力するデータ
- JSON
# 対応する設計書
- DFD
- ER
# 機能
- 図形を描画する
- 図形の位置をドラッグで調整できる(位置情報は記録しない)
- 編集モードと閲覧モードがある
# サンプルデータ
{
    "context": {
        "description": "○○システムについて"
        "root-process": {
            "id": "p0",
            "lebel": "-1",
            "label": "○○システム"
            "description": "",
            "prodess": [
                {
                    "level-id": "p1",
                    "lebel": "0",
                    "description": "□□を処理するプロセス",
                    "label": "□□画面",
                    "process": [
                        "level-id": "p1.1",
                        "lebel": "1",
                        "description": "",
                        "label": "",
                        "process": []
                    ],
                },
                {
                    "level-id": "p2",
                    "lebel": "0",
                    "description": "△△を処理するプロセス",
                    "label": "△△画面",
                    "process": [
                        "level-id": "p2.1",
                        "lebel": "1",
                        "description": "",
                        "label": "",
                        "process": []
                    ]
                },
            ],
        }
        "external-entity": [
            {
                "id": "e01",
                "lebel": "-1",
                "description": "",
                "label": "管理者",
            },
            {
                "id": "e02",
                "lebel": "-1",
                "description": "",
                "label": "ユーザー"
            },
        ],
        "data-store": [
            {
                "id": "s01",
                "lebel": "0",
                "label":"□□テーブル",
                "description": "",
                "file-name": "",
                columns: [
                    {
                        "name": "id",
                        "type": "String",
                        "primary": true,
                        "foreign": false,
                        "constraint": "NOT NULL,UNIQUE",
                    }
                ],
            },
            {
                "id": "s02",
                "lebel": "0",
                "label":"△△テーブル",
                "description": "",
                "file-name": "",
                columns: [
                ],
            },
        ],
        "data-flow": [
            {
                "from": "e01",
                "to": [
                    "p0",
                    "p1",
                    "p1.1",
                ],
                "label": "ログインする",
                "description": "",
            },
            {
                "from":"e02",
                "to": [
                    "p0",
                    "p1",
                    "p1.1",
                ],
                "label": "ログインする",
                "description": "",
            }
            {
                "from":"p0",
                "to": [
                    "e01",
                    "e02",
                ],
                "label": "ログアウトする",
                "description": "",
            },
        ]
    }
}
