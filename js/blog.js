class BlogManager{constructor(){this.searchInput=document.getElementById("blogSearch"),this.tagFilter=document.getElementById("tagFilter"),this.blogPosts=document.getElementById("blogPosts"),this.paginationContainer=null,this.POSTS_PER_PAGE=5,this.currentPage=1,this.filteredPosts=[],this.init()}init(){this.blogPosts&&(this.createPagination(),this.bindEvents(),this.filterPosts())}createPagination(){this.paginationContainer=document.createElement("div"),this.paginationContainer.className="blog-pagination",this.paginationContainer.setAttribute("role","navigation"),this.paginationContainer.setAttribute("aria-label","Blog pagination"),this.blogPosts.after(this.paginationContainer)}getPosts(){return Array.from(this.blogPosts.querySelectorAll(".blog-post"))}bindEvents(){this.searchInput&&this.searchInput.addEventListener("input",this.debounce(()=>{this.filterPosts()},300)),this.tagFilter&&this.tagFilter.addEventListener("click",a=>{"BUTTON"===a.target.tagName&&(this.tagFilter.querySelectorAll("button").forEach(a=>{a.classList.remove("active"),a.setAttribute("aria-pressed","false")}),a.target.classList.add("active"),a.target.setAttribute("aria-pressed","true"),this.filterPosts())})}debounce(a,b){let c;return function(...d){clearTimeout(c),c=setTimeout(()=>{clearTimeout(c),a(...d)},b)}}filterPosts(){const a=this.searchInput?.value.toLowerCase()||"",b=this.tagFilter?.querySelector("button.active")?.dataset.tag||"all";this.filteredPosts=this.getPosts().filter(c=>{const d=c.querySelector("h3")?.textContent.toLowerCase()||"",e=c.querySelector("p")?.textContent.toLowerCase()||"",f=c.dataset.tags?.split(" ")||[],g=!a||d.includes(a)||e.includes(a),h="all"===b||f.includes(b);return g&&h}),this.currentPage=1,this.showPage(),this.updateResultsInfo()}showPage(){const a=Math.ceil(this.filteredPosts.length/this.POSTS_PER_PAGE)||1;this.getPosts().forEach(a=>{a.style.display="none",a.setAttribute("aria-hidden","true")});const b=(this.currentPage-1)*this.POSTS_PER_PAGE,c=b+this.POSTS_PER_PAGE;this.filteredPosts.slice(b,c).forEach(a=>{a.style.display="block",a.setAttribute("aria-hidden","false")}),this.renderPagination(a)}renderPagination(a){var b=Math.min,c=Math.max;if(!this.paginationContainer)return;if(this.paginationContainer.innerHTML="",1>=a)return;const d=this.createPaginationButton("Previous",()=>{1<this.currentPage&&(this.currentPage--,this.showPage())});d.disabled=1===this.currentPage,d.setAttribute("aria-label","Go to previous page"),this.paginationContainer.appendChild(d);const e=c(1,this.currentPage-2),f=b(a,this.currentPage+2);if(1<e){const a=this.createPaginationButton("1",()=>{this.currentPage=1,this.showPage()});if(this.paginationContainer.appendChild(a),2<e){const a=document.createElement("span");a.textContent="...",a.className="pagination-ellipsis",this.paginationContainer.appendChild(a)}}for(let b=e;b<=f;b++){const a=this.createPaginationButton(b.toString(),()=>{this.currentPage=b,this.showPage()});b===this.currentPage&&(a.classList.add("active"),a.setAttribute("aria-current","page")),a.setAttribute("aria-label",`Go to page ${b}`),this.paginationContainer.appendChild(a)}if(f<a){if(f<a-1){const a=document.createElement("span");a.textContent="...",a.className="pagination-ellipsis",this.paginationContainer.appendChild(a)}const b=this.createPaginationButton(a.toString(),()=>{this.currentPage=a,this.showPage()});this.paginationContainer.appendChild(b)}const g=this.createPaginationButton("Next",()=>{this.currentPage<a&&(this.currentPage++,this.showPage())});g.disabled=this.currentPage===a,g.setAttribute("aria-label","Go to next page"),this.paginationContainer.appendChild(g)}createPaginationButton(a,b){const c=document.createElement("button");return c.textContent=a,c.addEventListener("click",b),c}updateResultsInfo(){const a=document.querySelector(".blog-results-info");a&&a.remove();const b=document.createElement("div");b.className="blog-results-info",b.setAttribute("aria-live","polite");const c=this.filteredPosts.length,d=this.getPosts().length;b.textContent=c===d?`Showing all ${c} posts`:`Showing ${c} of ${d} posts`,this.blogPosts.before(b)}}document.addEventListener("DOMContentLoaded",()=>{new BlogManager});const style=document.createElement("style");style.textContent=`
  .blog-results-info {
    font-size: 0.9rem;
    color: var(--text-muted, #666);
    margin-bottom: 1rem;
    font-style: italic;
  }
  
  .pagination-ellipsis {
    padding: 0.5rem;
    color: var(--text-muted, #666);
    user-select: none;
  }
  
  @media (max-width: 480px) {
    .blog-pagination button {
      min-width: 40px;
      padding: 0.4rem 0.6rem;
    }
    
    .pagination-ellipsis {
      padding: 0.4rem 0.2rem;
    }
  }
`,document.head.appendChild(style);