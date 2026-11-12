import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {matchingRows, stateFromURL, readerURL, contextURL, batchEnd} from '../public/script/reader.mjs';
const root=new URL('../public/',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');

test('Sakura releases the complete verified corpus and patch instructions',()=>{
  const index=JSON.parse(read('data/index.json'));
  assert.equal(index.scripts,285);
  assert.equal(index.passages,65164);
  assert.equal(index.scriptsIndex.length,285);
  assert.equal(new Set(index.scriptsIndex.map(s=>s.id)).size,285);
  assert.equal(index.scriptsIndex.reduce((n,s)=>n+s.count,0),65164);
  const home=read('index.html'), reader=read('script/index.html');
  assert.match(home,/Download English patch/);
  assert.match(home,/<h1 id="title">SAKURA<br \/>NO UTA<\/h1>\s*<p class="dek">/);
  assert.doesNotMatch(home,/japanese-title/);
  assert.match(home,/Patch version v1\.1\.0/);
  assert.match(home,/href="#install"/);
  assert.match(home,/id="install"/);
  assert.match(reader,/Script version v1\.1\.0/);
  assert.match(home,/Updating an earlier MAO patch/);
  assert.match(home,/Removing the patch/);
  assert.match(home,/The game still shows Japanese or old text/);
  assert.match(home,/10th Anniversary edition/);
  assert.match(home,/Native Windows movie playback and a full playthrough have not been verified/);
  assert.match(home+reader,/A legally acquired copy/);
  assert.doesNotMatch(home+reader,/MUMBAI|Hinglish|14,839|Complete draft|in development|Not released|not yet published/i);
});

test('every reader passage and search entry agrees, with only inert presentation HTML',()=>{
  const index=JSON.parse(read('data/index.json'));
  const search=JSON.parse(read('data/search.json'));
  const expected=[];
  let rubies=0, choices=0;
  for(const script of index.scriptsIndex) {
    const raw=read('data/scripts/'+script.id+'.json');
    assert.equal(createHash('sha256').update(raw).digest('hex'),script.sha256);
    const {rows}=JSON.parse(raw);
    assert.equal(rows.length,script.count);
    assert.equal(new Set(rows.map(r=>r.key)).size,rows.length);
    for(const row of rows) {
      for(const lang of ['ja','en']) {
        assert.ok(row[lang].text.trim());
        assert.ok(row[lang].html.trim());
        const tags=[...row[lang].html.matchAll(/<\/?([a-z]+)([^>]*)>/g)];
        for(const [,tag,attrs] of tags) {
          assert.ok(['span','div','ruby','rt','br','ul','li'].includes(tag),tag);
          assert.match(attrs,/^(?: class="[a-z0-9-]+")?$/);
        }
        assert.doesNotMatch(row[lang].html,/<script|onerror|source_ja_payload|revision_notes/);
      }
      rubies+=(row.ja.html.match(/<ruby>/g)||[]).length;
      choices+=row.en.html.includes('class="reader-choices"')?1:0;
      assert.doesNotMatch(row.en.html,/<ruby>/);
      assert.doesNotMatch(row.en.html,/\bHakki\b/);
      // A voiced source line must remain in the speaker's dialogue channel.
      // Source narration, thoughts, and quotations without a speaker are distinct.
      if(row.ja.html.includes('class="speaker"') && row.ja.text.split('\n').slice(1).join('\n').startsWith('「')) {
        assert.ok(row.en.html.includes('class="speaker"'),script.id+':'+row.key);
        const sourceUtterance=row.ja.text.split('\n').slice(1).join('\n');
        // Some named source blocks also contain an explicit narration clause.
        // Preserve that clause rather than forcing the entire block into speech.
        if (/^「[^」]*」$/.test(sourceUtterance.trim())) {
          const utterance=row.en.text.split('\n').slice(1).join('\n');
          assert.match(utterance,/^“/,script.id+':'+row.key);
          // Open quotation continuations are used for recited multi-line verse.
          if(utterance.includes('”')) {
            assert.doesNotMatch(utterance.replace(/“[^”]*”/g,''),/[A-Za-z]/,script.id+':'+row.key);
          }
        }
      }
      expected.push({script:script.id,key:row.key,ja:row.ja.text,en:row.en.text});
    }
  }
  assert.equal(rubies,524);
  assert.equal(choices,17);
  assert.deepEqual(search,expected);
});

test('prologue laughter remains audible dialogue with its speaker',()=>{
  const {rows}=JSON.parse(read('data/scripts/00_op_01_1.json'));
  for(const key of ['91','93','114','116','118','120']) {
    const row=rows.find(r=>r.key===key);
    assert.match(row.en.text,/^Naoya\n“[A-Za-z! ]+”$/);
    assert.doesNotMatch(row.en.text,/laugh|burst|harder/);
  }
});

test('download metadata and instructions identify the accepted game patch',()=>{
  const patch=JSON.parse(read('patch-release.json'));
  const home=read('index.html'),guide=read('patch-installation.txt');
  assert.equal(patch.version,'1.1.0');
  assert.equal(patch.passages,65164);
  assert.equal(patch.patchSha256,'40941729f87c9d9ea29565429bf6beebe95d2ae55b5e9fefbeecbef20f305f03');
  assert.equal(patch.openingMovie.path,'movie/ou9nq3hr2_mao.mp4');
  assert.equal(patch.openingMovie.sha256,'3fd39c19f7cf3d7f036589370abbb7f2e1dc7460d5cd91eb35a85bc35dc0189d');
  assert.equal(patch.openingMovie.englishSubtitleCues,17);
  assert.ok(guide.includes(patch.openingMovie.path));
  assert.ok(home.includes(patch.downloadUrl));
  assert.ok(home.includes(patch.releaseUrl));
  assert.ok(guide.includes(patch.patchSha256));
  assert.ok(home.includes(patch.patchSha256));
  assert.ok(home.includes(patch.openingMovie.path));
  assert.match(home,/opening displays a blank\/white picture/);
  assert.match(guide,/KNOWN MOVIE ISSUE/);
  assert.match(patch.runtimeCheck,/movie playback.*not fixed/i);
  assert.match(guide,/UPDATE[\s\S]*REMOVE \/ RETURN TO JAPANESE[\s\S]*TROUBLESHOOTING/);
  assert.ok(patch.downloadUrl.startsWith('https://github.com/MAO-TLs/sakura-no-uta/releases/download/'));
  assert.ok(patch.releaseUrl.startsWith('https://github.com/MAO-TLs/sakura-no-uta/releases/tag/'));
});

test('Sakura retains the shared reader typography and working local assets',()=>{
  assert.equal(createHash('sha256').update(read('mao-reader-template.css')).digest('hex'),'7b91560a578fc64b74c4c83153e1d9f55c2e840184b3147969657c4be0774e0c');
  for(const page of ['index.html','script/index.html']) {
    const html=read(page), base=new URL(page,root);
    for(const [,link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if(link.startsWith('/')||/^(?:https?:|mailto:)/.test(link))continue;
      const target=new URL(link,base);
      if(target.pathname.endsWith('/'))target.pathname+='index.html';
      assert.ok(existsSync(target),page+': '+link);
    }
  }
});

test('Sakura current and corpus schemas use whole-word English search',()=>{
  const rows=[{key:'1',en:{text:'Dora.'},ja:{text:'名前'}},{key:'2',en:{text:'Adorable.'},ja:{text:'可愛い'}}];
  assert.deepEqual(matchingRows(rows,'dora').map(r=>r.key),['1']);
  assert.equal(matchingRows([{en:'Dora’s name',ja:'名前'}],'dora').length,1);
  assert.equal(matchingRows([{en:'',ja:'桜の花が咲く'}],'桜の花').length,1);
  assert.equal(batchEnd(0,170,false),170);
  assert.equal(batchEnd(0,170,true),80);
});

test('Sakura navigation preserves search and rejects external back links',()=>{
  const base='https://mao-tls.github.io/sakura-no-uta/script/';
  assert.equal(stateFromURL(base,[]).script,'');
  const url=contextURL(base,'sample','99','Dora',base+'?scope=corpus&q=Dora');
  const state=stateFromURL(url,[{id:'sample'}]);
  assert.equal(state.line,'99');
  assert.equal(state.highlight,'Dora');
  assert.equal(state.back,'/sakura-no-uta/script/?scope=corpus&q=Dora');
  assert.equal(readerURL(base,{back:'https://example.com/'}).search,'');
});
