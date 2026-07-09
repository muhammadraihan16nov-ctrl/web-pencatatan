from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "app.db")


def get_db():
    db = getattr(g, "db", None)
    if db is None:
        db = g.db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_db(exception):
    db = getattr(g, "db", None)
    if db is not None:
        db.close()


def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tgl TEXT NOT NULL,
            pelanggan TEXT NOT NULL,
            produk TEXT NOT NULL,
            qty INTEGER NOT NULL,
            harga_satuan REAL NOT NULL,
            subtotal REAL NOT NULL,
            created_at TEXT NOT NULL
        );
        """
    )
    con.commit()
    con.close()


@app.get("/api/sales")
def list_sales():
    db = get_db()
    cur = db.execute(
        "SELECT id, tgl, pelanggan, produk, qty, harga_satuan, subtotal, created_at FROM sales ORDER BY id DESC"
    )
    rows = cur.fetchall()
    return jsonify({"ok": True, "data": [dict(r) for r in rows]})


@app.post("/api/sales")
def create_sale():
    data = request.get_json(force=True, silent=True) or {}

    tgl = (data.get("tgl") or "").strip()
    pelanggan = (data.get("pelanggan") or "").strip()
    produk = (data.get("produk") or "").strip()
    qty = data.get("qty")
    harga_satuan = data.get("harga_satuan")

    errors = []
    if not tgl:
        errors.append("Tanggal wajib diisi")
    if not pelanggan:
        errors.append("Nama pelanggan wajib diisi")
    if not produk:
        errors.append("Nama produk wajib diisi")

    try:
        qty = int(qty)
        if qty <= 0:
            errors.append("Qty harus > 0")
    except Exception:
        errors.append("Qty tidak valid")

    try:
        harga_satuan = float(harga_satuan)
        if harga_satuan <= 0:
            errors.append("Harga satuan harus > 0")
    except Exception:
        errors.append("Harga satuan tidak valid")

    if errors:
        return jsonify({"ok": False, "errors": errors}), 400

    subtotal = qty * harga_satuan
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO sales (tgl, pelanggan, produk, qty, harga_satuan, subtotal, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (tgl, pelanggan, produk, qty, harga_satuan, subtotal, created_at),
    )
    db.commit()

    return jsonify({"ok": True, "id": cur.lastrowid}), 201


@app.delete("/api/sales/<int:sale_id>")
def delete_sale(sale_id: int):
    db = get_db()
    cur = db.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
    db.commit()
    if cur.rowcount == 0:
        return jsonify({"ok": False, "error": "Data tidak ditemukan"}), 404
    return jsonify({"ok": True})


@app.get("/")
def index_redirect():
    return jsonify({"ok": True, "message": "Backend aktif. Buka index.html di frontend."})


if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)

