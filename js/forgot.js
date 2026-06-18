const $ = (id) => document.getElementById(id);

$('fg-submit').addEventListener('click', () => {
  const email = $('fg-email').value.trim();
  $('fg-error').style.display = 'none';
  $('fg-info').style.display = 'none';

  if (!email) {
    $('fg-error').textContent = 'Email is required.';
    $('fg-error').style.display = 'block';
    return;
  }

  $('fg-info').textContent = 'Backend connection is temporarily disabled.';
  $('fg-info').style.display = 'block';
});
