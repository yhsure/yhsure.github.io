const selector = '.range-field input[type="range"]'

const paint = input => {
  const min = Number(input.min || 0)
  const max = Number(input.max || 100)
  const value = Number(input.value)
  const progress = ((value - min) / (max - min)) * 100
  const grit = (Math.round(value) * 17) % 5 - 2
  input.style.setProperty("--range-progress", `${progress}%`)
  input.style.setProperty("--grit-angle", `${grit * .14}deg`)
  input.style.setProperty("--grit-x", `${grit * .1}px`)
}

const paintAll = () => document.querySelectorAll(selector).forEach(paint)
let pointer = ""
let lastTick = 0

document.addEventListener("pointerdown", event => {
  if (event.target.matches(selector)) pointer = event.pointerType
})

const release = () => {
  pointer = ""
}

document.addEventListener("pointerup", release)
document.addEventListener("pointercancel", release)

document.addEventListener("input", event => {
  if (!event.target.matches(selector)) return
  paint(event.target)
  if (pointer === "touch" && Date.now() - lastTick > 45) {
    navigator.vibrate?.(2)
    lastTick = Date.now()
  }
})

new MutationObserver(paintAll).observe(document.querySelector("#root"), {
  childList: true,
  subtree: true,
  characterData: true,
})

paintAll()
