"""Extract only data from the supplied Thrust disassembly; no external assets."""
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
s=(root/'disasm/thrust.6502').read_text()
def data(label):
    m=re.search(r'^\s*\.'+re.escape(label)+r'\b[^\n]*\n(.*?)(?=^\s*\.[A-Za-z_]|\Z)',s,re.M|re.S)
    if not m: raise ValueError(label)
    return [int(x,16) for line in m[1].splitlines() if 'EQUB' in line for x in re.findall(r'\$([0-9A-Fa-f]{2})\b',line.split(';')[0])]
score_block=s.split('.high_score_table_relocated\n')[1].split('\n}',1)[0]
score_entries=[{'score':int(c+b+a),'name':name.strip()} for a,b,c,name in re.findall(r'EQUB\s+\$([\dA-F]{2}),\$([\dA-F]{2}),\$([\dA-F]{2})[^\n]*\n\s*EQUS\s+"([^"]+)"',score_block)]
assert len(score_entries)==8
names=['gun_up_right','gun_down_right','gun_up_left','gun_down_left','fuel','pod_stand','generator','door_switch_right','door_switch_left']
assets={
'DEFAULT_HIGH_SCORES':score_entries,
'TERRAIN':[{k:data(f'terrain_data_level_{i}_{k}') for k in 'ABCD'} for i in range(6)],
'LEVELS':[{'objs':list(map(list,zip(*(data(f'level_{i}_{suffix}') for suffix in ['obj_pos_X','obj_pos_Y_EXT','obj_pos_Y','obj_type','gun_param']))))} for i in range(6)],
'SHIP_SPRITES':[data(f'ship_sprite_{i}_data') for i in range(17)]+[data('sheild_sprite_data')],
'POD_SPRITE':data('pod_sprite_data'),
'OBJ_SPRITES':[{k:data(f'obj_sprite_data_{k}_{n}') for k in 'AB'} for n in names],
'FONT':[data(f'font_data_line_{i}') for i in range(5)],
'ENVELOPES':[data(f'envelope_{i}') for i in range(1,5)],
'STATUS_BAR':data('status_bar_bytes')[:1152],
'INTRO_BYTES':data('mode_7_instructions'),
'RESETS':[data(f'level_{i}_reset_data') for i in range(6)]}
p=root/'index.html'; h=p.read_text()
for name,value in assets.items():
    new='const '+name+' = '+json.dumps(value,separators=(',',':'))+';'
    if re.search(r'const '+name+r' = \[',h): h=re.sub(r'const '+name+r' = \[.*?\];',lambda _:new,h,count=1,flags=re.S)
    else: h=h.replace('// Original data','// Original data\n'+new)
p.write_text(h)
print('Extracted',len(assets),'asset groups from thrust.6502')
