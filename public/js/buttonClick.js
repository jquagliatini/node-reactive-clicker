function main({
  sessid
}) {
  const linksList = document.getElementById('links');
  linksList.appendChild(
    Object.assign(document.createElement('li'), {
      innerHTML: `tv link: <a href="/view/${sessid}">${location.host}/view/${sessid}</a>`,
    }),
  );

  const button = document.getElementById('btn');
  const STATE = {
    clicks: Number(button.innerText) || 0,
  };

  button.addEventListener('click', () => {
    fetch(`/sessions/${sessid}/click`, {
      method: 'PUT'
    });
    STATE.clicks = STATE.clicks + 1; // optimistic UI
    button.innerText = STATE.clicks;
  });
}

const match = /sessid=(.+)\b/.exec(document.cookie);
if (!match || !match[1]) {
  fetch('/session')
    .then((res) => {
      if (!res.ok) {
        throw new Error('not ok!');
      }
      return res.json()
    })
    .then((session) => {
      document.cookie = `sessid=${session.id}`;
      main({
        sessid: session.id
      });
    });
}

main({
  sessid: match[1]
});
