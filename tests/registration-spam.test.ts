import assert from "node:assert/strict"
import test from "node:test"

import { hasRegistrationSpamSignals } from "../src/lib/registration-spam.ts"

test("registration rejects promotional links embedded in identity fields", () => {
  assert.equal(hasRegistrationSpamSignals({
    firstName: "Unlock 70K Lira - Your Key is One Tap Away https://bit.ly/4hCx3XY",
    lastName: "Go",
    studioName: "Portrait Studio",
  }), true)
  assert.equal(hasRegistrationSpamSignals({
    firstName: "Jamie",
    lastName: "Smith",
    studioName: "Visit www.example.com",
  }), true)
})

test("registration permits ordinary names and studio names", () => {
  assert.equal(hasRegistrationSpamSignals({
    firstName: "Anne-Marie",
    lastName: "O'Connor",
    studioName: "O'Connor Portraits",
  }), false)
  assert.equal(hasRegistrationSpamSignals({
    firstName: "Lira",
    lastName: "Kent",
    studioName: "One Tap Photography",
  }), false)
})
