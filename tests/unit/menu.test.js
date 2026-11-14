import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,expect,it } from 'vitest';
import MenuScreen from '../../src/components/game/MenuScreen.jsx';

describe('main menu launch',()=>{
  it('renders the default four-player menu without a runtime error',()=>{
    const html=renderToStaticMarkup(React.createElement(MenuScreen));
    expect(html).toContain('HOST GAME');
    expect(html).toContain('Local player count');
    expect(html).toContain('<option selected="">4</option>');
  });
  it('renders the selected local player count passed by the game',()=>{
    const html=renderToStaticMarkup(React.createElement(MenuScreen,{localPlayers:3,setLocalPlayers(){}}));
    expect(html).toContain('<option selected="">3</option>');
  });
});
