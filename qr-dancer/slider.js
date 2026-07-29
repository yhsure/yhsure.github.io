const selector = '.range-field input[type="range"]'

const paint = input => {
  const min = Number(input.min || 0)
  const max = Number(input.max || 100)
  const value = Number(input.value)
  const progress = ((value - min) / (max - min)) * 100
  const grit = (Math.round(value) * 17) % 5 - 2
  input.style.setProperty("--range-progress", `${progress}%`)
  input.style.setProperty("--grit-angle", `${grit * .18}deg`)
  input.style.setProperty("--grit-x", `${grit * .12}px`)
}

const paintAll = () => document.querySelectorAll(selector).forEach(paint)

document.addEventListener("input", event => {
  if (!event.target.matches(selector)) return
  paint(event.target)
})

new MutationObserver(paintAll).observe(document.querySelector("#root"), {
  childList: true,
  subtree: true,
  characterData: true,
})

paintAll()
