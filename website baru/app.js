const API_BASE = "http://127.0.0.1:5000";

const saleForm = document.getElementById("saleForm");
const salesBody = document.getElementById("salesBody");
const statusEl = document.getElementById("status");
const subtotalView = document.getElementById("subtotalView");
const btnRefresh = document.getElementById("btnRefresh");
const countPill = document.getElementById("countPill");

function formatRp(n) {
    const val = Number(n) || 0;
    return "Rp " + val.toLocaleString("id-ID");
}

function setStatus(msg, kind = "neutral") {
    statusEl.textContent = msg;
    statusEl.style.color = kind === "error" ? "#fecaca" : (kind === "ok" ? "#bbf7d0" : "rgba(229,240,255,.7)");
}

function getFormValues() {
    const fd = new FormData(saleForm);
    return {
        tgl: (fd.get("tgl") || "").toString(),
        pelanggan: (fd.get("pelanggan") || "").toString(),
        produk: (fd.get("produk") || "").toString(),
        qty: fd.get("qty"),
        harga_satuan: fd.get("harga_satuan"),
    };
}

function calcSubtotal() {
    const fd = new FormData(saleForm);
    const qty = Number(fd.get("qty")) || 0;
    const harga = Number(fd.get("harga_satuan")) || 0;
    subtotalView.textContent = formatRp(qty * harga);
}

saleForm.addEventListener("input", calcSubtotal);

// default date
(function initDate() {
    const tglInput = saleForm.querySelector("input[name='tgl']");
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    tglInput.value = `${yyyy}-${mm}-${dd}`;
    calcSubtotal();
})();

async function loadSales() {
    setStatus("Memuat data...", "neutral");
    try {
        const res = await fetch(`${API_BASE}/api/sales`);
        const json = await res.json();
        if (!json.ok) throw new Error("Gagal memuat data");

        const rows = json.data || [];
        countPill.textContent = `${rows.length} data`;

        if (rows.length === 0) {
            salesBody.innerHTML = `
        <tr><td colspan="8" style="color:rgba(229,240,255,.65)">Belum ada data penjualan.</td></tr>
      `;
            setStatus("Belum ada data.", "neutral");
            return;
        }

        salesBody.innerHTML = rows.map(r => {
            const subtotal = formatRp(r.subtotal);
            const harga = formatRp(r.harga_satuan);
            return `
        <tr>
          <td>${r.id}</td>
          <td>${r.tgl}</td>
          <td>${escapeHtml(r.pelanggan)}</td>
          <td>${escapeHtml(r.produk)}</td>
          <td class="right">${r.qty}</td>
          <td class="right">${harga}</td>
          <td class="right">${subtotal}</td>
          <td>
            <button class="small-btn danger" data-id="${r.id}">Hapus</button>
          </td>
        </tr>
      `;
        }).join("");

        setStatus("Data siap.", "ok");
    } catch (e) {
        setStatus("Error: tidak bisa memuat data. Pastikan backend sudah jalan.", "error");
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "<")
        .replaceAll(">", ">")
        .replaceAll('"', '"')
        .replaceAll("'", "&#039;");
}

saleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = getFormValues();

    setStatus("Menyimpan...", "neutral");

    try {
        const res = await fetch(`${API_BASE}/api/sales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (!res.ok) {
            const errors = json.errors || ["Gagal menyimpan data"];
            setStatus(errors.join(" · "), "error");
            return;
        }

        saleForm.reset();
        // restore date
        (function restoreDate() {
            const tglInput = saleForm.querySelector("input[name='tgl']");
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            tglInput.value = `${yyyy}-${mm}-${dd}`;
        })();

        calcSubtotal();
        await loadSales();
        setStatus("Simpan berhasil.", "ok");
    } catch (err) {
        setStatus("Error: tidak bisa menyimpan data. Pastikan backend sudah jalan.", "error");
    }
});

salesBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const ok = confirm(`Hapus data penjualan ID ${id}?`);
    if (!ok) return;

    try {
        const res = await fetch(`${API_BASE}/api/sales/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
            setStatus("Gagal menghapus data.", "error");
            return;
        }
        await loadSales();
        setStatus("Data berhasil dihapus.", "ok");
    } catch {
        setStatus("Error: tidak bisa menghapus data.", "error");
    }
});

btnRefresh.addEventListener("click", loadSales);

loadSales();

