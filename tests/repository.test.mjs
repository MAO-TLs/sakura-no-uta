import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../public/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('release and reader are self-contained under the unchanged public URL',()=>{
  for(const page of ['index.html','script/index.html']){
    const html=read(page);
    assert.ok(html.includes('href="https://github.com/MAO-TLs/sakura-no-uta">GitHub</a>'));
    assert.ok(html.includes('https://mao-tls.github.io/sakura-no-uta/'));
    assert.doesNotMatch(html,/MAO-TLs\.github\.io\/(?:tree|releases)/);
    for(const [,link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      if(link.startsWith('/')||/^(?:https?:|mailto:)/.test(link))continue;
      const url=new URL(link,new URL(page,root));
      assert.ok(url.pathname.startsWith(root.pathname),`${page}: ${link} escapes the title repository`);
      if(url.pathname.endsWith('/'))url.pathname+='index.html';
      assert.ok(existsSync(url),`${page}: ${link}`);
    }
  }
  assert.match(read('script/reader.mjs'),/from '\.\.\/reader-search\.mjs'/);
});

test('compact reader spacing remains identical to the shared layout',()=>{
  const css=read('mao-reader-template.css');
  assert.match(css.match(/\.reader-page \.reader-intro h1\s*\{([^}]+)\}/)[1],/line-height:\s*1\.02;/);
  const description=css.match(/\.reader-page \.reader-intro > p:last-of-type\s*\{([^}]+)\}/)[1];
  assert.match(description,/margin:\s*18px 0 0;/);
  assert.match(description,/font-size:\s*18px;/);
  assert.match(description,/line-height:\s*1\.6;/);
  for(const rule of read('styles.css').matchAll(/([^{}]*\.reader-intro[^{}]*)\{([^}]+)\}/g))
    assert.doesNotMatch(rule[2],/(?:font(?:-size)?|line-height|margin(?:-block)?|padding-block)\s*:/);
});
