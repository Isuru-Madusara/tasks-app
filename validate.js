function validateTitle(title) {
  return typeof title === 'string' && title.trim().length > 0 && title.length <= 200;
}

module.exports = { validateTitle };
