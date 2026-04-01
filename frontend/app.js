const API = "http://localhost:5000/api/clients/";

async function loadClients() {
    const res = await fetch(API);
    const data = await res.json();

    const list = document.getElementById("clients");
    list.innerHTML = "";

    data.forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.name} (${c.age})`;
        list.appendChild(li);
    });
}

async function addClient() {
    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: parseInt(age) })
    });

    loadClients();
}

loadClients();