/* FJ Tile Card v1.2.0 — original standalone Home Assistant Lovelace card — MIT */
(() => {
  const TYPE = 'fj-tile-card';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const stateText = (entity, id) => {
    if (!entity) return 'Indisponible';
    const s = entity.state, domain = id.split('.')[0];
    if (s === 'unavailable') return 'Indisponible';
    if (s === 'unknown') return 'Inconnu';
    if (domain === 'lock') return ({locked:'Verrouillée',unlocked:'Déverrouillée',locking:'Verrouillage…',unlocking:'Déverrouillage…',jammed:'Bloquée'})[s] || s;
    if (domain === 'binary_sensor') {
      const cls = entity.attributes.device_class;
      if (cls === 'connectivity' || cls === 'problem' || cls === 'running') return s === 'on' ? (cls === 'problem'?'Problème':'Connecté') : (cls === 'problem'?'Normal':'Déconnecté');
      if (cls === 'door' || cls === 'window' || cls === 'opening') return s === 'on' ? 'Ouvert' : 'Fermé';
      if (cls === 'motion' || cls === 'occupancy') return s === 'on' ? 'Détecté' : 'Aucun mouvement';
      return s === 'on' ? 'Actif' : 'Inactif';
    }
    if (['light','switch','input_boolean','fan'].includes(domain)) return s === 'on' ? 'Allumé' : 'Éteint';
    if (domain === 'cover') return ({open:'Ouvert',closed:'Fermé',opening:'Ouverture…',closing:'Fermeture…'})[s] || s;
    const unit = entity.attributes.unit_of_measurement;
    return s + (unit ? ' ' + unit : '');
  };
  const activeState = (entity, id) => {
    if (!entity) return false;
    const domain = id.split('.')[0];
    if (domain === 'lock') return entity.state === 'locked';
    if (domain === 'binary_sensor') return entity.state === 'on';
    if (domain === 'cover') return entity.state === 'open';
    return entity.state === 'on';
  };
  class FJTileCard extends HTMLElement {
    constructor() { super(); this.attachShadow({mode:'open'}); this._key=''; this._tpl={}; this._unsubs=[]; this._generation=0; }
    setConfig(config) {
      if (config.entity && !config.entity.includes('.')) throw Error('Entité Home Assistant invalide.');
      this.config = {layout:'compact', tap_action:'more-info', ...config};
      this._key=''; this._setupTemplates(); this.render();
    }
    set hass(hass) { const changed=this._hass?.connection!==hass?.connection; this._hass=hass; if(changed)this._setupTemplates(); this.render(); }
    connectedCallback(){this._setupTemplates();}
    disconnectedCallback(){this._generation++;this._unsubs.splice(0).forEach(fn=>fn());}
    _setupTemplates(){
      this._generation++;const generation=this._generation;
      this._unsubs.splice(0).forEach(fn=>fn());this._tpl={};
      if(!this.isConnected||!this._hass?.connection?.subscribeMessage||!this.config)return;
      for(const field of ['primary','secondary','icon','color','badge_icon','badge_color']){
        const value=this.config[field];
        if(typeof value!=='string'||(!value.includes('{{')&&!value.includes('{%')))continue;
        this._hass.connection.subscribeMessage(message=>{
          if(generation!==this._generation)return;
          this._tpl[field]=message.result??'';this._key='';this.render();
        },{type:'render_template',template:value,variables:{config:this.config}})
          .then(unsub=>{if(generation===this._generation)this._unsubs.push(unsub);else unsub();})
          .catch(err=>console.warn('FJ Tile template:',err));
      }
    }
    _value(field,fallback){const v=this.config[field];return typeof v==='string'&&(v.includes('{{')||v.includes('{%'))?(this._tpl[field]??fallback):(v??fallback);}
    getCardSize() { return ['horizontal','compact'].includes(this.config?.layout) || this.config?.compact ? 1 : 2; }
    static getConfigElement() { return document.createElement('fj-tile-card-editor'); }
    static getStubConfig(hass) {
      return {entity:Object.keys(hass?.states||{})[0] || 'sensor.temperature', layout:'square', tap_action:'more-info'};
    }
    render() {
      if (!this.config || !this._hass) return;
      const id=this.config.entity||'', e=this._hass.states[id], s=e?.state||'unavailable';
      const dark = typeof this._hass.themes?.darkMode === 'boolean' ? this._hass.themes.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches;
      const title=esc(this._value('primary',this.config.name) || e?.attributes.friendly_name || id || 'Tuile FJ');
      const rawState = id.startsWith('person.') ? (s==='home'?'Maison':s==='not_home'?'Absent':this._hass.states['zone.'+s]?.attributes?.friendly_name||s) : stateText(e,id);
      const state = esc(this._value('secondary', (this.config.hide_state ? '' : (this.config.state_content === 'last_changed' && e?.last_changed ? new Date(e.last_changed).toLocaleString('fr-CA') : rawState))));
      const picture = this.config.show_entity_picture && e?.attributes?.entity_picture ? String(e.attributes.entity_picture) : '';
      const safePicture = picture.startsWith('/') || /^https?:\/\//.test(picture) ? picture : '';
      const compact = this.config.layout === 'compact' || this.config.compact === true;
      const vertical = this.config.vertical === true && !compact;
      const icon=esc(this._value('icon',e?.attributes.icon) || ({lock:'mdi:lock',light:'mdi:lightbulb',switch:'mdi:toggle-switch',binary_sensor:'mdi:check-circle',sensor:'mdi:gauge',cover:'mdi:garage',person:'mdi:account',camera:'mdi:cctv'})[id.split('.')[0]] || 'mdi:information-outline');
      const active=activeState(e,id);
      const palette={green:dark?'#287D60':'#247155',orange:'#E99B30',red:'#D74F4F',blue:'#1E88E5',yellow:'#D6AD29',purple:'#9C70DA'};const chosen=this._value('color',this.config.icon_color||this.config.active_color);const color=palette[chosen]||chosen||(dark?'#287D60':'#247155');
      const accent=active||!id||chosen?color:(dark?'#AAB1AD':'#555F58');
      const key=JSON.stringify([id,title,state,icon,active,dark,this.config.layout,this.config.tap_action,this.config.active_color,safePicture,compact,vertical,this.config.hide_state,this.config.grid_options,this.config.primary,this.config.secondary,this.config.badge_icon,this.config.badge_color,this.config.color]);
      if (key===this._key) return;
      this._key=key;
      const horizontal=this.config.layout==='horizontal' || compact;
      this.shadowRoot.innerHTML=`
        <style>
          :host { display:block; --fj-card:${dark?'#101412':'#FFFFFF'}; --fj-panel:${dark?'#171C19':'#F0F2EF'}; --fj-border:${dark?'#303632':'#DEE4DD'}; --fj-text:${dark?'#FFFFFF':'#202720'}; --fj-muted:${dark?'#AAB1AD':'#555F58'}; --fj-accent:${accent}; }
          ha-card { background:var(--fj-card);border:1px solid var(--fj-border);border-radius:20px;padding:${compact?'0':'12px'};box-sizing:border-box;color:var(--fj-text);cursor:pointer; }
          .tile { min-height:${compact?'54px':horizontal?'64px':'120px'};border:1px solid var(--fj-border);border-radius:16px;background:var(--fj-panel);
            display:flex;flex-direction:${horizontal?'row':'column'};align-items:center;justify-content:${horizontal?'flex-start':'center'};
            gap:${compact?'8px':horizontal?'12px':'9px'};padding:${compact?'7px 9px':'12px'};box-sizing:border-box; }
          .symbol { background:${dark?'#252B28':'#E3EAE5'};border-radius:50%;width:${compact?'40px':'42px'};height:${compact?'40px':'42px'};flex-shrink:0;display:flex;align-items:center;justify-content:center; }
          ha-icon { --mdc-icon-size:23px;color:var(--fj-accent); } .symbol{position:relative}.fj-badge{position:absolute;right:-4px;top:-4px;width:18px;height:18px;border-radius:50%;background:${s==='home'?'#39A854':'#2685CA'};border:2px solid var(--fj-panel);box-sizing:border-box;display:flex;align-items:center;justify-content:center}.fj-badge ha-icon{--mdc-icon-size:11px;color:white} .avatar{width:100%;height:100%;object-fit:cover;border-radius:50%;}
          .details { min-width:0;text-align:${horizontal?'left':'center'}; }
          .name { font-size:14px;font-weight:700;overflow-wrap:anywhere; }
          .state { margin-top:${compact?'2px':'5px'};font-size:12px;color:var(--fj-muted);font-weight:650;overflow-wrap:anywhere; }
        </style>
        <ha-card tabindex="0" role="button" aria-label="${title}: ${state}">
          <div class="tile"><div class="symbol">${safePicture ? `<img class="avatar" src="${esc(safePicture)}" alt="">` : `<ha-icon icon="${icon}"></ha-icon>`}${id.startsWith('person.')?`<span class="fj-badge"><ha-icon icon="${esc(this._value('badge_icon',(s==='home'?'mdi:home':'mdi:map-marker')))}"></ha-icon></span>`:''}</div>
          <div class="details"><div class="name">${title}</div>${this.config.hide_state ? "" : `<div class="state">${state}</div>`}</div></div>
        </ha-card>`;
      const card=this.shadowRoot.querySelector('ha-card');
      const activate=()=> {
        if (this.config.tap_action === 'none') return;
        if (this.config.tap_action === 'toggle') {
          const domain=id.split('.')[0];
          if (['switch','light','input_boolean','fan'].includes(domain)) {
            this._hass.callService(domain,'toggle',{entity_id:id}).catch(err=>console.error('FJ Tile Card:',err));
          }
          return;
        }
        this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));
      };
      card.addEventListener('click',activate);
      card.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();activate();}});
    }
  }
  if (!customElements.get(TYPE)) customElements.define(TYPE,FJTileCard);
  class FJTileCardEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._rendered=false;}
    setConfig(config){const old=this.config;this.config=config;if(!old||['entity','name','icon','layout','tap_action','active_color','show_entity_picture','hide_state','vertical'].some(k=>old[k]!==config[k]))this.render();}
    set hass(hass){this._hass=hass;if(!this._rendered)this.render();}
    render(){
      if(!this.config||!this._hass)return;
      const entities=Object.keys(this._hass.states).sort();
      const select=(id,values,current)=>'<select id="'+id+'">'+values.map(([v,label])=>'<option value="'+esc(v)+'" '+(v===current?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
      this.shadowRoot.innerHTML=`
        <style>label{display:block;margin:10px 0 5px;font-weight:600}input,select{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #888} .hint{font-size:12px;opacity:.7;margin-top:6px}</style>
        <label>Entité</label>${select('entity',entities.map(x=>[x,x]),this.config.entity)}
        <label>Nom affiché / primary</label><input id="name" placeholder="Nom de la tuile" value="${esc(this.config.name||'')}">
        <label>Texte secondaire / secondary</label><input id="secondary" value="${esc(this.config.secondary||'')}" placeholder="État automatique"><label>Couleur / color</label><input id="color" value="${esc(this.config.color||'')}" placeholder="green, orange, #287D60"><label>Icône (ex. mdi:home)</label><input id="icon" placeholder="Automatique" value="${esc(this.config.icon||'')}">
        <label>Format</label>${select('layout',[['square','Carré'],['horizontal','Horizontal'],['compact','Compact (tuile native)']],this.config.layout||'square')}
        <label><input type="checkbox" id="show_entity_picture" ${this.config.show_entity_picture?'checked':''} style="width:auto"> Afficher la photo de l'entité</label>
        <label><input type="checkbox" id="hide_state" ${this.config.hide_state?'checked':''} style="width:auto"> Masquer l'état</label>
        <label>Action au toucher</label>${select('tap_action',[['more-info','Afficher les détails'],['toggle','Basculer (lumières/interrupteurs)'],['none','Aucune']],this.config.tap_action||'more-info')}
        <label>Couleur active (HEX facultatif)</label><input id="active_color" placeholder="#247155" value="${esc(this.config.active_color||'')}">
        <div class="hint">Le thème clair/sombre suit Home Assistant. Les serrures ne sont jamais commandées par cette carte.</div>`;
      this._rendered=true;
      for(const id of ['entity','name','secondary','color','icon','layout','tap_action','active_color','show_entity_picture','hide_state']){
        this.shadowRoot.getElementById(id).addEventListener('change',()=>{
          const next={...this.config};
          for(const key of ['entity','name','secondary','color','icon','layout','tap_action','active_color','show_entity_picture','hide_state'])next[key]=['show_entity_picture','hide_state'].includes(key)?this.shadowRoot.getElementById(key).checked:this.shadowRoot.getElementById(key).value;
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
        });
      }
    }
  }
  if(!customElements.get('fj-tile-card-editor'))customElements.define('fj-tile-card-editor',FJTileCardEditor);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(c=>c.type===TYPE))window.customCards.push({type:TYPE,name:'FJ Tile Card',description:'Tuiles chic jour/nuit pour Home Assistant'});
})();