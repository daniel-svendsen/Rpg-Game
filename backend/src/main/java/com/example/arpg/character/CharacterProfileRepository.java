package com.example.arpg.character;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CharacterProfileRepository extends JpaRepository<CharacterProfileEntity, Long> {

    Optional<CharacterProfileEntity> findByUserEmail(String email);
}

