FROM python:3.11-slim

# 作業ディレクトリの設定
WORKDIR /app

# コンテナ内の環境変数を設定（Pythonのバッファリング無効化など）
ENV PYTHONUNBUFFERED True

# 依存パッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# Cloud Run が指定する $PORT でリッスンする起動コマンド
CMD ["python", "server.py"]
