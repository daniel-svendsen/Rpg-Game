# Project Vision

## Purpose

This document captures the higher-level direction for Shardborne when that direction stretches beyond what belongs in `README.md`.

## Vision

Shardborne is a small top-down action RPG inspired by Path of Exile, but intentionally reduced in scope and visual complexity.

The goal is not to recreate a full-scale ARPG. The goal is to build a focused prototype that still captures some of the fun of:

- gearing and progression
- repeatable combat runs
- drop excitement
- build identity through spells, supports, and items
- longer-term chase goals

## Product Shape

The project is currently optimized for:

- web-first development
- mobile-first UI decisions
- a small but extendable gameplay foundation
- data-driven rules where practical

Long-term platform direction:

- frontend: `TypeScript + React + Phaser 4 + Vite`
- backend: `Spring Boot + Java + PostgreSQL + JWT`
- future Android path: `Capacitor`

## Design Priorities

The current product direction emphasizes:

- clear gameplay rules in domain code
- saved progression as a first-class system
- centralized balance and config
- repeatable map progression
- simple visuals with room to grow later

Important early gameplay identity:

- `Training Grounds` is rerunnable forever
- consumable maps are part of saved progression
- `Map Shards` are part of the early crafting loop
- items can be sold for gold
- the shop remains part of the progression pressure
- spell/support UX should move toward a simplified FF7 materia-style flow

## What The Prototype Should Feel Like

Even at small scope, runs should gradually move away from "tiny arena bursts" and toward something that feels more like:

- entering a run with intent
- clearing meaningful packs
- finding items, maps, shards, and spells
- making progression decisions between runs
- pursuing rarer rewards over time

## Longer-Term Directions

Some ideas are intentionally being explored without locking them into immediate implementation:

- stronger map pacing and sustain tuning
- clearer item rarity and reward readability
- more visual variation in map backgrounds
- rare spawns that can lead into boss-key or boss-reward loops
- better long-term chase rewards through boss-specific pools

These should be treated as roadmap direction, not automatic implementation commitments.

## Portfolio Angle

This project is also meant to demonstrate:

- modular gameplay architecture
- AI-assisted development with guardrails
- save/persistence awareness
- simulator-first balance iteration
- thoughtful scoping instead of uncontrolled feature sprawl

