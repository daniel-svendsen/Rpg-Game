package com.example.arpg.character;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CharacterProfileRepository extends JpaRepository<CharacterProfileEntity, Long> {

    List<CharacterProfileEntity> findAllByUserEmail(String email);

    Optional<CharacterProfileEntity> findByIdAndUserEmail(Long id, String email);

    long countByUserEmail(String email);
}

