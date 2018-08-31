function main() {
  const button = document.getElementById('btn');
  button.disabled = true;
  const paths = location.pathname.split('/');
  const session = paths[paths.length - 1];

  fetch(`/sessions/${session}`)
    .then((res) => {
      if (!res.ok) throw new Error('not ok');
      return res.json();
    })
    .then(({
      clicks
    }) => {
      button.innerText = clicks;
      const source = new EventSource(`/sessions/${session}/stream`);
      source.addEventListener('message', (e) => {
        console.log(e);
        button.innerText = e.data;
      });

      source.addEventListener('connect', console.log);
      source.addEventListener('error', console.error);
    });
}

main();
