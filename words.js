// Kid-friendly word lists, single lowercase words only. Edit freely (run `node test.js` after).
const u = s => [...new Set(s.trim().split(/\s+/))];
module.exports = {
  easy: u(`apple banana orange grapes lemon cherry strawberry carrot potato tomato corn bread cheese egg cake cookie pizza candy milk juice
  sun moon star cloud rain snow rainbow tree flower leaf grass mountain river beach ocean fish shark whale dolphin crab turtle frog duck
  chicken cow pig horse sheep dog cat mouse rabbit bear lion tiger monkey elephant giraffe zebra snake bird butterfly bee spider ant
  ball hat shoe sock shirt glasses ring crown house door window chair table bed lamp clock key book pencil scissors cup spoon fork plate
  bottle bag umbrella car bus train boat plane bicycle truck rocket heart smile hand foot nose eye ear tooth kite balloon bell flag`),
  medium: u(`castle dragon guitar helicopter igloo jellyfish kangaroo lighthouse octopus skateboard volcano waterfall robot pirate sandwich
  telescope toothbrush windmill cactus campfire dinosaur fireworks hamburger island notebook backpack bridge compass crayon diamond drum
  feather flashlight fountain globe hammer hedgehog hourglass lantern magnet microphone mirror mushroom necklace owl paintbrush parrot
  peacock piano pillow pineapple pyramid raincoat sailboat saxophone scarecrow seahorse snowflake spaceship squirrel stethoscope sunflower
  sunglasses tent thermometer tractor treasure trumpet unicorn vase violin watermelon wizard wheelbarrow zipper ambulance anchor bakery
  bonfire bubble cannon carousel chimney cupcake dentist doctor farmer firefighter fisherman gardener ghost hammock harp jungle knight
  lizard mailbox mitten moose ostrich pancake pelican popcorn puppet rooster scooter skeleton sled snail submarine swing teapot toaster
  tornado tunnel walrus ladder mermaid sword`),
  hard: u(`astronaut avalanche blizzard camouflage celebration chandelier cobweb constellation crossroads detective earthquake electricity
  eclipse escalator evaporation friendship gravity gymnastics hibernation horizon imagination invention kaleidoscope labyrinth lightning
  marathon magician migration mystery orchestra parachute passport pharmacy photographer planet pollution quicksand reflection recycling
  satellite scoreboard shipwreck silhouette skyscraper sneeze snorkel souvenir stampede sunburn surprise teamwork thunderstorm tightrope
  trampoline tradition traffic umpire vacation volunteer waterslide weightlifting wilderness windshield yawn zeppelin alarm applause
  archaeologist backstage bandage birthday boomerang brainstorm catapult cartwheel champion circus courage curiosity daydream dizzy drought
  echo engineer expedition fossil generosity glacier greenhouse harvest headache hurricane hiccup honesty illusion journey juggler kindness
  library lifeguard lullaby mechanic microscope monsoon mosaic nightmare observatory orbit paradox patience periscope pilgrim planetarium
  rainforest referee relay rehearsal scientist seesaw shadow skyline sleepwalk snowboard spotlight stopwatch sundial tadpole temperature
  tournament tsunami whisper`)
};
