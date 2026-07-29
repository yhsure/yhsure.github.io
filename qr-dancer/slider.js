const selector = '.range-field input[type="range"]'

const paint = input => {
  const min = Number(input.min || 0)
  const max = Number(input.max || 100)
  const progress = ((Number(input.value) - min) / (max - min)) * 100
  input.style.setProperty("--range-progress", `${progress}%`)
}

const paintAll = () => document.querySelectorAll(selector).forEach(paint)

document.addEventListener("input", event => {
  if (event.target.matches(selector)) paint(event.target)
})

new MutationObserver(paintAll).observe(document.querySelector("#root"), {
  childList: true,
  subtree: true,
  characterData: true,
})

paintAll()
