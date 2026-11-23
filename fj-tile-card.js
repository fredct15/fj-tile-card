/* FJ Tile Card v1.2.4 — original standalone Home Assistant Lovelace card — MIT */
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
      this._unsubs.splice(0).forEach(fn=>fn());
      if(!this.isConnected||!this._hass?.connection?.subscribeMessage||!this.config)return;
      for(const field of ['primary','secondary','icon','color','badge_icon','badge_color']){
        const value=this.config[field];
        if(typeof value!=='string'||(!value.includes('{{')&&!value.includes('{%')))continue;
        this._hass.connection.subscribeMessage(message=>{
          if(generation!==this._generation)return;
          this._tpl[field]=typeof message.result==='string'?message.result:(message.result?.result??'');this._key='';this.render();
        },{type:'render_template',template:value,variables:{config:{entity:this.config.entity||''}}})
          .then(unsub=>{if(generation===this._generation)this._unsubs.push(unsub);else unsub();})
          .catch(err=>console.warn('FJ Tile template:',err));
      }
    }
    _value(field,fallback){const v=this.config[field];return typeof v==='string'&&(v.includes('{{')||v.includes('{%'))?(this._tpl[field]??'Chargement…'):(v??fallback);}
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
      const rawState = (id.startsWith('person.') || id.startsWith('device_tracker.')) ? (s==='home'?'Maison':s==='not_home'?'Absent':this._hass.states['zone.'+s]?.attributes?.friendly_name||s) : stateText(e,id);
      const state = esc(this._value('secondary', (this.config.hide_state ? '' : (this.config.state_content === 'last_changed' && e?.last_changed ? new Date(e.last_changed).toLocaleString('fr-CA') : rawState))));
      const picture = this.config.show_entity_picture && e?.attributes?.entity_picture ? String(e.attributes.entity_picture) : '';
      const safePicture = picture.startsWith('/') || /^https?:\/\//.test(picture) ? picture : '';
      const compact = this.config.layout === 'compact' || this.config.compact === true;
      const vertical = this.config.vertical === true && !compact;
      const icon=esc(this._value('icon',e?.attributes.icon) || ({lock:'mdi:lock',light:'mdi:lightbulb',switch:'mdi:toggle-switch',binary_sensor:'mdi:check-circle',sensor:'mdi:gauge',cover:'mdi:garage',person:'mdi:account',camera:'mdi:cctv'})[id.split('.')[0]] || 'mdi:information-outline');
      const active=activeState(e,id);
      // Mushroom-style palette: use Home Assistant RGB theme variables when available.
      // Named colors are explicit even for inactive entities.
      const mushroomColors={
        red:'rgb(var(--rgb-red, 244, 67, 54))',
        orange:'rgb(var(--rgb-orange, 255, 152, 0))',
        yellow:'rgb(var(--rgb-yellow, 255, 193, 7))',
        green:'rgb(var(--rgb-green, 76, 175, 80))',
        blue:'rgb(var(--rgb-blue, 33, 150, 243))',
        purple:'rgb(var(--rgb-purple, 156, 39, 176))',
        pink:'rgb(var(--rgb-pink, 233, 30, 99))',
        teal:'rgb(var(--rgb-teal, 0, 150, 136))',
        cyan:'rgb(var(--rgb-cyan, 0, 188, 212))',
        indigo:'rgb(var(--rgb-indigo, 63, 81, 181))',
        grey:'rgb(var(--rgb-grey, 158, 158, 158))',
        gray:'rgb(var(--rgb-grey, 158, 158, 158))',
        black:'rgb(var(--rgb-black, 0, 0, 0))',
        white:'rgb(var(--rgb-white, 255, 255, 255))'
      };
      const chosen=this._value('color',this.config.icon_color||this.config.active_color);
      const chosenKey=String(chosen||'').trim().toLowerCase();
      const color=mushroomColors[chosenKey]||(/^#[0-9a-f]{3,8}$/i.test(chosenKey)?chosenKey:null)||(dark?'#287D60':'#247155');
      const accent=chosenKey?color:(active||!id?color:(dark?'#AAB1AD':'#555F58'));
      const titleLines=this.config.title_lines===2?2:1;
      const key=JSON.stringify([id,title,state,icon,active,dark,this.config.layout,this.config.tap_action,this.config.active_color,safePicture,compact,vertical,this.config.hide_state,this.config.grid_options,this.config.primary,this.config.secondary,this.config.badge_icon,this.config.badge_color,this.config.color,this.config.title_lines,this._tpl]);
      if (key===this._key) return;
      this._key=key;
      const horizontal=this.config.layout==='horizontal' || compact;
      this.shadowRoot.innerHTML=`
        <style>
          :host { display:block; --fj-card:${dark?'#101412':'#FFFFFF'}; --fj-panel:${dark?'#171C19':'#F0F2EF'}; --fj-border:${dark?'#303632':'#DEE4DD'}; --fj-text:${dark?'#FFFFFF':'#202720'}; --fj-muted:${dark?'#AAB1AD':'#555F58'}; --fj-accent:${accent}; }
          ha-card { background:var(--fj-card);border:1px solid var(--fj-border);border-radius:20px;padding:${compact?'0':'12px'};box-sizing:border-box;color:var(--fj-text);cursor:pointer; }
          .tile { height:${compact?'54px':'auto'};min-height:${compact?'54px':horizontal?'64px':'120px'};border:1px solid var(--fj-border);border-radius:16px;background:var(--fj-panel);
            display:flex;flex-direction:${horizontal?'row':'column'};align-items:center;justify-content:${horizontal?'flex-start':'center'};
            gap:${compact?'8px':horizontal?'12px':'9px'};padding:${compact?'5px 9px':'12px'};box-sizing:border-box; }
          .symbol { background:${dark?'#252B28':'#E3EAE5'};border-radius:50%;width:${compact?'40px':'42px'};height:${compact?'40px':'42px'};flex-shrink:0;display:flex;align-items:center;justify-content:center; }
          ha-icon { --mdc-icon-size:23px;color:var(--fj-accent); } .symbol{position:relative}.fj-badge{position:absolute;right:-4px;top:-4px;width:18px;height:18px;border-radius:50%;background:${s==='home'?'#39A854':'#2685CA'};border:2px solid var(--fj-panel);box-sizing:border-box;display:flex;align-items:center;justify-content:center}.fj-badge ha-icon{--mdc-icon-size:11px;color:white} .avatar{width:100%;height:100%;object-fit:cover;border-radius:50%;}
          .details { min-width:0;text-align:${horizontal?'left':'center'}; }
          .name { font-size:14px;font-weight:700;overflow-wrap:anywhere;line-height:17px; }
          .state { margin-top:${compact?'2px':'5px'};font-size:12px;color:var(--fj-muted);font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; } .details{flex:1;min-width:0}.name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${titleLines};line-clamp:${titleLines};white-space:normal;overflow:hidden;text-overflow:ellipsis}
        </style>
        <ha-card tabindex="0" role="button" aria-label="${title}: ${state}">
          <div class="tile"><div class="symbol">${safePicture ? `<img class="avatar" src="${esc(safePicture)}" alt="">` : `<ha-icon icon="${icon}"></ha-icon>`}${(id.startsWith('person.')||id.startsWith('device_tracker.'))?`<span class="fj-badge"><ha-icon icon="${esc(this._value('badge_icon',(s==='home'?'mdi:home':'mdi:map-marker')))}"></ha-icon></span>`:''}</div>
          <div class="details"><div class="name">${title}</div>${this.config.hide_state ? "" : `<div class="state">${state}</div>`}</div></div>
        </ha-card>`;
      const card=this.shadowRoot.querySelector('ha-card');
      const activate=()=> {
        const action=typeof this.config.tap_action==='object' ? this.config.tap_action : {action:this.config.tap_action||'more-info'};
        const type=action.action||'more-info';
        if(type==='none')return;
        if(type==='navigate'){
          const destination=action.navigation_path||this.config.navigation_path||'';
          if(!destination)return;
          history.pushState(null,'',destination);
          window.dispatchEvent(new Event('location-changed'));
          return;
        }
        if(type==='url'){
          const destination=action.url_path||this.config.url_path||'';
          if(destination && (destination.startsWith('https://')||destination.startsWith('http://')||destination.startsWith('/')))window.open(destination,'_blank','noopener,noreferrer');
          return;
        }
        if(type==='toggle'){
          const domain=id.split('.')[0];
          if(id && ['switch','light','input_boolean','fan'].includes(domain))this._hass.callService(domain,'toggle',{entity_id:id}).catch(err=>console.error('FJ Tile Card:',err));
          return;
        }
        if(type==='more-info' && id)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));
      };
      card.addEventListener('click',activate);
      card.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();activate();}});
    }
  }
  if (!customElements.get(TYPE)) customElements.define(TYPE,FJTileCard);
  class FJTileCardEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});this._rendered=false;}
    setConfig(config){const old=this.config;this.config=config;if(!old||['entity','name','icon','layout','tap_action','active_color','show_entity_picture','hide_state','vertical','title_lines','color','secondary','primary'].some(k=>old[k]!==config[k]))this.render();}
    set hass(hass){this._hass=hass;if(!this._rendered)this.render();else {const picker=this.shadowRoot.getElementById('entity');if(picker)picker.hass=hass;}}
    render(){
      if(!this.config||!this._hass)return;
      const entities=Object.keys(this._hass.states).sort();
      const select=(id,values,current)=>'<select id="'+id+'">'+values.map(([v,label])=>'<option value="'+esc(v)+'" '+(v===current?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select>';
      this.shadowRoot.innerHTML=`
        <style>label{display:block;margin:10px 0 5px;font-weight:600}input,select{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #888} .hint{font-size:12px;opacity:.7;margin-top:6px}</style>
        <label>Entité (facultative)</label><ha-entity-picker id="entity" allow-custom-entity></ha-entity-picker>
        <div class="hint">Tapez un nom ou un identifiant pour rechercher une entité.</div>
        <label>Nom affiché / primary</label><input id="name" placeholder="Nom de la tuile" value="${esc(this.config.name||'')}">
        <label>Texte secondaire / secondary</label><input id="secondary" value="${esc(this.config.secondary||'')}" placeholder="État automatique"><label>Couleur / color</label><input id="color" value="${esc(this.config.color||'')}" placeholder="green, orange, #287D60"><label>Icône (ex. mdi:home)</label><input id="icon" placeholder="Automatique" value="${esc(this.config.icon||'')}">
        <label>Lignes du titre</label>${select('title_lines',[['1','Une ligne'],['2','Deux lignes (hauteur fixe)']],String(this.config.title_lines||1))}
        <label>Format</label>${select('layout',[['square','Carré'],['horizontal','Horizontal'],['compact','Compact (tuile native)']],this.config.layout||'square')}
        <label><input type="checkbox" id="show_entity_picture" ${this.config.show_entity_picture?'checked':''} style="width:auto"> Afficher la photo de l'entité</label>
        <label><input type="checkbox" id="hide_state" ${this.config.hide_state?'checked':''} style="width:auto"> Masquer l'état</label>
        <label>Action au toucher</label>${select('tap_action',[['more-info','Afficher les détails'],['navigate','Naviguer vers une page'],['url','Ouvrir une URL'],['toggle','Basculer (lumières/interrupteurs)'],['none','Aucune']],typeof this.config.tap_action==='object'?this.config.tap_action.action:this.config.tap_action||'more-info')}
        <label>Destination (chemin Dashboard ou URL)</label><input id="destination" placeholder="/dashboard-v3/securite" value="${esc((typeof this.config.tap_action==='object'?(this.config.tap_action.navigation_path||this.config.tap_action.url_path):'')||this.config.navigation_path||this.config.url_path||'')}">
        <div class="hint">Pour Naviguer : /dashboard-v3/securite. Pour URL : https://exemple.com</div>
        <label>Couleur active (HEX facultatif)</label><input id="active_color" placeholder="#247155" value="${esc(this.config.active_color||'')}">
        <div class="hint">Le thème clair/sombre suit Home Assistant. Les serrures ne sont jamais commandées par cette carte.</div>`;
      this._rendered=true;
      const picker=this.shadowRoot.getElementById('entity');
      picker.hass=this._hass;
      picker.value=this.config.entity||'';
      const update=()=>{
        const next={...this.config};
        const fields=['name','secondary','color','icon','layout','active_color','show_entity_picture','hide_state','title_lines'];
        next.entity=picker.value||undefined;
        if(!next.entity)delete next.entity;
        for(const key of fields){
          const el=this.shadowRoot.getElementById(key);
          next[key]=['show_entity_picture','hide_state'].includes(key)?el.checked:(key==='title_lines'?Number(el.value):el.value);
        }
        const action=this.shadowRoot.getElementById('tap_action').value;
        const destination=this.shadowRoot.getElementById('destination').value.trim();
        if(action==='navigate')next.tap_action={action,navigation_path:destination};
        else if(action==='url')next.tap_action={action,url_path:destination};
        else next.tap_action=action;
        this.config=next;
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
      };
      picker.addEventListener('value-changed',update);
      for(const key of ['name','secondary','color','icon','layout','active_color','show_entity_picture','hide_state','title_lines','tap_action','destination']){
        this.shadowRoot.getElementById(key).addEventListener('change',update);
      }
    }
  }
  if(!customElements.get('fj-tile-card-editor'))customElements.define('fj-tile-card-editor',FJTileCardEditor);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(c=>c.type===TYPE))window.customCards.push({type:TYPE,name:'FJ Tile Card',description:'Tuiles chic jour/nuit pour Home Assistant'});
})();