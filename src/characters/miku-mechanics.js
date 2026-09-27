const mikuTrackBySong = Object.freeze({ Heaven: 'Break', 'Spring Storm': 'Critical', 'Play-With-Fire': 'Expert' });

export const legacyMethods = {
  isMikuNavigator() {
    return this.state.navigator?.codename === 'MIKU';
  },

  isVirtualConcertActive() {
    return this.isMikuNavigator() && this.state.navigator.virtualConcert?.active === true;
  },

  applyMikuSongEffect(skillName, song, duration = 3, idPrefix = 'miku') {
    const id = value => `${idPrefix}_${value}`;
    // Concert copies name the regular song effect they must not duplicate.
    const apply = status => this.applyMikuPartyBuff(idPrefix === 'miku' ? status : { ...status, regularId: `miku_${status.id.slice(idPrefix.length + 1)}` });
    if (skillName === 'Feel the Beat') {
      if (song === 'Heaven') apply({ id: id('heaven_pierce'), name: 'HEAVEN PIERCE', stat: 'pierce', value: 0.11, duration });
      if (song === 'Spring Storm') apply({ id: id('spring_damage'), name: 'SPRING STORM DMG', stat: 'damage', value: 0.183, duration });
      if (song === 'Play-With-Fire') apply({ id: id('play_crit_damage'), name: 'PLAY-WITH-FIRE CRIT DMG', stat: 'critDamage', value: 0.22, duration });
    } else if (skillName === 'Clear Sound') {
      if (song === 'Heaven') this.healMikuParty(0.3);
      if (song === 'Spring Storm') apply({ id: id('spring_weakness'), name: 'SPRING STORM WEAKNESS DMG', stat: 'weaknessDamage', value: 0.059, duration });
      if (song === 'Play-With-Fire') apply({ id: id('play_crit_rate'), name: 'PLAY-WITH-FIRE CRIT RATE', stat: 'critRate', value: 0.11, duration });
    }
  },

  applyMikuTrackSkill(action) {
    const song = this.state.navigator.currentSong;
    const track = mikuTrackBySong[song];
    if (action.name === 'Feel the Beat') {
      this.applyMikuPartyBuff({ id: 'miku_feel_attack', name: 'FEEL THE BEAT ATK', stat: 'attack', value: 0.305, duration: 3 });
    } else {
      this.applyMikuPartyBuff({ id: 'miku_clear_damage', name: 'CLEAR SOUND DMG', stat: 'damage', value: 0.183, duration: 3 });
    }
    if (track && !this.state.navigator.tracks.includes(track)) {
      this.applyMikuSongEffect(action.name, song);
      this.state.navigator.tracks.push(track);
      this.applyMikuPartyBuff({ id: `miku_setlist_${track.toLowerCase()}`, name: `SETLIST ${track.toUpperCase()}`, stat: 'attack', value: 0.12, duration: 3 });
      this.emit('track', `MIKU gained ${track} Track from ${song}.`, {
        actorId: this.state.navigator.id, sourceType: 'navigator', track, song, tone: 'buff'
      });
    } else if (track) {
      this.emit('track', `MIKU already held ${track} Track, so the conditional ${song} effect did not reactivate.`, {
        actorId: this.state.navigator.id, sourceType: 'navigator', track, song, tone: 'buff'
      });
    }
    for (const skill of this.state.navigator.skills.filter(item => ['Feel the Beat', 'Clear Sound'].includes(item.name))) {
      this.state.navigator.cooldowns[skill.id] = 4;
    }
  }
};
