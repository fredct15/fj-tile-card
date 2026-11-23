/* FJ Tile Card v1.0.0 — original standalone Home Assistant Lovelace card — MIT */
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
    constructor() { super(); this.attachShadow({mode:'open'}); this._key=''; }
    setConfig(config) {
      if (!config.entity || !config.entity.includes('.')) throw Error('Choisissez une entité Home Assistant.');
      this.config = {layout:'square', tap_action:'more-info', ...config};
      this._key=''; this.render();
    }
    set hass(hass) { this._hass=hass; this.render(); }
    getCardSize() { return this.config?.layout === 'horizontal' ? 1 : 2; }
    static getConfigElement() { return document.createElement('fj-tile-card-editor'); }
    static getStubConfig(hass) {
      return {entity:Object.keys(hass?.states||{})[0] || 'sensor.temperature', layout:'square', tap_action:'more-info'};
    }
    render() {
      if (!this.config || !this._hass) return;
      const id=this.config.entity, e=this._hass.states[id], s=e?.state||'unavailable';
      const dark = typeof this._hass.themes?.darkMode === 'boolean' ? this._hass.themes.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches;
      const title=esc(this.config.name || e?.attributes.friendly_name || id);
      const state=esc(stateText(e,id));
      const icon=esc(this.config.icon || e?.attributes.icon || ({lock:'mdi:lock',light:'mdi:lightbulb',switch:'mdi:toggle-switch',binary_sensor:'mdi:check-circle',sensor:'mdi:gauge',cover:'mdi:garage',person:'mdi:account',camera:'mdi:cctv'})[id.split('.')[0]] || 'mdi:information-outline');
      const active=activeState(e,id);
      const color=this.config.active_color || (dark?'#287D60':'#247155');
      const accent=active?color:(dark?'#AAB1AD':'#555F58');
      const key=JSON.stringify([id,title,state,icon,active,dark,this.config.layout,this.config.tap_action,this.config.active_color]);
      if (key===this._key) return;
      this._key=key;
      const horizontal=this.config.layout==='horizontal';
      this.shadowRoot.innerHTML=`
        <style>
          :host { display:block; --fj-card:${dark?'#101412':'#FFFFFF'}; --fj-panel:${dark?'#171C19':'#F0F2EF'}; --fj-border:${dark?'#303632':'#DEE4DD'}; --fj-text:${dark?'#FFFFFF':'#202720'}; --fj-muted:${dark?'#AAB1AD':'#555F58'}; --fj-accent:${accent}; }
          ha-card { background:var(--fj-card);border:1px solid var(--fj-border);border-radius:20px;padding:12px;box-sizing:border-box;color:var(--fj-text);cursor:pointer; }
          .tile { min-height:${horizontal?'64px':'120px'};border:1px solid var(--fj-border);border-radius:16px;background:var(--fj-panel);
            display:flex;flex-direction:${horizontal?'row':'column'};align-items:center;justify-content:${horizontal?'flex-start':'center'};
            gap:${horizontal?'12px':'9px'};padding:12px;box-sizing:border-box; }
          .symbol { background:${dark?'#252B28':'#E3EAE5'};border-radius:50%;width:42px;height:42px;flex-shrink:0;display:flex;align-items:center;justify-content:center; }
          ha-icon { --mdc-icon-size:23px;color:var(--fj-accent); }
          .details { min-width:0;text-align:${horizontal?'left':'center'}; }
          .name { font-size:13px;font-weight:700;overflow-wrap:anywhere; }
          .state { margin-top:5px;font-size:11px;color:var(--fj-accent);font-weight:650;overflow-wrap:anywhere; }
        </style>
        <ha-card tabindex="0" role="button" aria-label="${title}: ${state}">
          <div class="tile"><div class="symbol"><ha-icon icon="${icon}"></ha-icon></div>
          <div class="details"><div class="name">${title}</div><div class="state">${state}</div></div></div>
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
    setConfig(config){const old=this.config;this.config=config;if(!old||['entity','name','icon','layout','tap_action','active_color'].some(k=>old[k]!==config[k]))this.render();}
    set hass(hass){this._hass=hass;if(!this._rendered)this.render();}
    render(){
      if(!this.config||!this._hass)return;
      const entities=Object.keys(this._hass.states).sort();
      const select=(id,values,current)=>'<select id="'+id+'">'+values.map(([v,label])=>'<option value="'+esc(v)+'" '+(v===current?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
      this.shadowRoot.innerHTML=`
        <style>label{display:block;margin:10px 0 5px;font-weight:600}input,select{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #888} .hint{font-size:12px;opacity:.7;margin-top:6px}</style>
        <label>Entité</label>${select('entity',entities.map(x=>[x,x]),this.config.entity)}
        <label>Nom affiché</label><input id="name" placeholder="Nom de la tuile" value="${esc(this.config.name||'')}">
        <label>Icône (ex. mdi:home)</label><input id="icon" placeholder="Automatique" value="${esc(this.config.icon||'')}">
        <label>Format</label>${select('layout',[['square','Carré'],['horizontal','Horizontal']],this.config.layout||'square')}
        <label>Action au toucher</label>${select('tap_action',[['more-info','Afficher les détails'],['toggle','Basculer (lumières/interrupteurs)'],['none','Aucune']],this.config.tap_action||'more-info')}
        <label>Couleur active (HEX facultatif)</label><input id="active_color" placeholder="#247155" value="${esc(this.config.active_color||'')}">
        <div class="hint">Le thème clair/sombre suit Home Assistant. Les serrures ne sont jamais commandées par cette carte.</div>`;
      this._rendered=true;
      for(const id of ['entity','name','icon','layout','tap_action','active_color']){
        this.shadowRoot.getElementById(id).addEventListener('change',()=>{
          const next={...this.config};
          for(const key of ['entity','name','icon','layout','tap_action','active_color'])next[key]=this.shadowRoot.getElementById(key).value;
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
        });
      }
    }
  }
  if(!customElements.get('fj-tile-card-editor'))customElements.define('fj-tile-card-editor',FJTileCardEditor);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(c=>c.type===TYPE))window.customCards.push({type:TYPE,name:'FJ Tile Card',description:'Tuiles chic jour/nuit pour Home Assistant'});
})();