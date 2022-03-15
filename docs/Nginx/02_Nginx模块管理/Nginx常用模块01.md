# Nginx常用模块一

​	Nginx由内核和模块组成。Nginx本身做的工作实际很少，当它接到一个HTTP请求时，它仅仅是通过查找配置文件将此次请求映射到一个location block,而此location中所配置的各个指令则会启动不同的模块去完成工作，因此模块可以看做Nginx真正的劳动工作者. 通常一个location中的指令会涉及一个handler模块和多个filter模块(当然，多个location可以复用同一个模块) 。 handler模块负责处理请求,完成响应内容的生成，而filter模块对响应内容进行处理。用户根据自己的需要所开发的模块都属于第三方模块。正是有了这么多模块的支撑，Nginx的功能才会如此强大。

Nginx的模块从结构上分为核心模块、基础模块和第三方模块:

- 核心模块: HTTP模块、EVENT模块和MAIL模块;
- 基础模块: HTTP Access模块、HTTP FastCGI模块、HTTP Proxy模块和HTTP Rewrite模块; 
- 第三方模块: HTTP Upstream Request Hash模块、 Notice模块和HTTP Access Key模块。

Nginx的模块从功能上分为如下三类:

- Handlers (处理器模块)：此类模块直接处理请求,并进行输出内容和修改headers信息等操作。Handlers处理器模块般只能有一个;
- Filters (过滤器模块)：此类模块主要对其他处理器模块输出的内容进行修改操作,最后Nginx输出;
- Proxies (代理类模块)：此类模块是Nginx的HTTP Upstream之类的模块，这些模块主要与后端一些服务比如FastCG|等进行交互，实现服务代理和负载均衡等功能。

## 1、核心功能(Core functionality)

functionality [ˌfʌŋkʃəˈnæləti] 功能

- worker_processes

```nginx
Syntax: worker_processes number | auto;
Default: worker_processes 1;
Context: main
```

  最佳值取决于许多因素，包括(但不限于) CPU核心的数量、存储数据的硬盘驱动器的数量和负载模式。一般将其设置为可用CPU核心的数量。

- worker_cpu_affinity ( [əˈfɪnəti] )

```nginx
Syntax: worker_cpu_affinity cpumask ...;
	    worker_cpu_affinity auto [cpumask];
Default: -
Context: main
```

将工作进程绑定到CPU集。每个CPU集由允许的CPU的位掩码表示。应该为每个工作进程定义一个单独的集合。默认情况下,工作进程不绑定到任何特定的CPU。该指令仅在FreeBSD和Linux上可用。

例如:

```nginx
worker_processes 4;
worker_cpu_affinity 0001 0010 0100 1000;
#将每个工作进程绑定到单独的CPU

worker_processes 2;
worker_cpu_affinity 0101 1010;
#将第一个工作进程绑定到CPU0/CPU2,将第二个工作进程绑定到CPU1/CPU3，这个例子适用于超线程情况

worker_processes auto;
worker_cpu_affinity auto;
#1.9.10版本后允许将工作进程自动绑定到可用的CPU
```

- worker_priority ( [praɪˈɔːrəti])

```nginx
Syntax: worker_priority number;
Default: worker_priority 0;
Context: main
```

为工作进程定义调度优先级，就像由nice命令执行一样: 负数表示优先级更高。允许范围通常在20到20之间

- worker_rlimit_nofile

```nginx
Syntax: worker_rlimit_nofile number;
Default: -
Context: main
```

更改工作进程的最大打开文件数(rlimit_nofile)限制，默认较小，生产环境一般需要调高，如: 65535.（需要同时修改linux同一时间开启的文件数）

```shell
# 修改linux的同一时间最多可开启的文件数
$ ulimit -n 65535
# 如果需要永久修改 则需要修改配置文件/etc/security/limits.conf
* soft nofile 65536      # open files  (-n)
* hard nofile 65536
 
* soft nproc 65565
* hard nproc 65565       # max user processes   (-u)
```

- worker_connection

```nginx
Syntax: worker_connections number;
Default: worker_connections 1024;
Context: events
```


设置能够被一个工作进程打开的最大并发连接数。应该记住，这个数字包括所有连接(例如，与代理服务器的连接等)，而不仅仅是与客户机的连接。另一个需要考虑的问题是，实际同时连接的数量不能超过打开文件的最大数量的当前限制( worker_rlimit_nofile.) 。

- use

```nginx
Syntax: use method;
Default: -
Context: events
```

指定要使用的连接处理方法。通常不需要显式地指定它，因为nginx默认使用最有效的方法。如: useepoll;

- accept_mutex （ [əkˈsept]  //,mjuː ˈtɛks// 接受互斥）

```nginx
Syntax: accept_mutex on|off;
Default: accept_mutex off;
Context: events
```

如果启用:on，工作进程将轮流接受新的连接。否则将通知所有工作进程有关新连接的信息，但只有一个进程可以获得连接。如果新连接的数量较低，则某些工作进程可能会浪费系统资源。在版本1.11.3之前，默认值为on。并发多的时候建议开启。

## 2、http核心模块 （ngx _http_core_module）

- http

```nginx
Syntax: http { ... }
Default: -
Context: main
```

提供配置文件上下文，其里面指定HTTP服务器指令

- server

```nginx
Syntax: server { ... }
Default: -
Context: http
```

配置虚拟主机。基于IP的和基于域名的虚拟主机。listen指令描述了接收连接的所有地址和端口 , server_name指令列出了所有的域名。

- listen

```nginx
Syntax: listen address [:port] [defau1t_server] [ss1] [http2 | spdy]
[proxy_protoco1] [setfib=number] [fastopen=number] [backlog=number]
[rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred] [bind]
[ipv6only=on|off] [reuseport] [so_keepalive=on|off| [keepid1e] : [keepintv1]:[keepcnt]];
listen port [default_server] [ss1] [http2|spdy] [proxy_protoco1]
[setfib=number] [fastopen=number] [backlog=number] [rcvbuf=size] [sndbuf=size]
[accept_filter=filter] [deferred] [bind] [ipv6only=on|off] [reuseport]
[so_keepalive=on|off|[keepid1e] : [keepintv1] : [keepcnt]];
listen unix:path [default_server] [ssl] [http2|spdy] [proxy_protoco1]
[backlog=number] [rcvbuf=size] [sndbuf=size] [accept_filter=filter] [deferred]
[bind] [so_keepalive=on|off|[keepidle]:[keepintv1]:[keepcnt]];
Default: listen *:80 | *:8000; #默认值
Context: server #使用字段：server
```

设置IP的地址和端口，或服务器将接受请求的Unix域套接字的路径,例如:

```nginx
listen 127.0.0.1:8000;
listen 127.0.0.1;
listen 8000;
listen *:8000;
listen localhost:8000;
# ipv6地址格式（0.7.36）在一个方括号中指定：
listen [::]:8000;
listen [fe80::1];
# 0.8.21版本以后nginx可以监听unix套接口：
listen unix:/tmp/nginx1.sock;
```

- server_name

```nginx
Syntax: server_name name ...;
Default: server_name "";
Context: server
```

设置虚拟服务器的名字。例如:

```nginx
server {
server_name example.com www.example.com;
}
#服务器名称可以包括星号("*") 来替换名称的第一部分或最后一部分:
server {
server_name example.com * .example.com www.example.*;
}

#支持~起始的字符做正则表达式模式匹配，性能原因慎用
server {
server_name www.example.com~^www\d+\.example\.com$; # \d表示[0-9]
}
```

匹配优先级机制从高到低:

1. 首先是字符串精确匹配如:https://www.cnblogs.com/ykzou/p/5840729.html
2. 左侧通配符如：*.demo
3. 右侧通配符如：demo.*
4. 正则表达式如：-^.*\.demo
5. default_server

- root

```nginx
Syntax: root path;
Default: root html;
Context: http, server, location, if in location
```

设置请求的根目录，例如：

```nginx
location /i/ {
	root /data/w3;
}
# /data/w3/i/top.gif文件将响应"/i/top.gif"请求而发送
# 路径值可以包含变量，除了$document_root和$realpath_root。
```

- alias [ˈeɪliəs] 

```nginx
Syntax: alias path;
Default: -
Context：1ocation
```

定义指定的location的一个替换

```nginx
location /i/ {
	alias /data/w3/images/;
}
#对于"/i/top.gif"的请求,将发送文件/data/w3/images/top.gif。
#路径值可以包含变量，除了$document_root和$realpath_root
#alias后面必须要用 "/" 结束，否则会找不到文件
#如果alias配置在正则匹配的location内，则正则表达式中必须包含捕获语句(也就是括号())，
#而且alias配置中也要引用这些捕获值。如:
location ~ ^/users/(.+\.(?:gif|jpe?g|png))$ {
	alias /data/w3/images/$1;
}
```

```nginx
# 关于alias和root的区别： 
# root和alias是系统文件路径的设置。 
# root用来设置根目录，而alias用来重置当前文件的目录。

location /img/ {
    alias /var/www/image/;
}
#若按照上述配置的话，则访问/img/目录里面的文件时，ningx会自动去/var/www/image/目录找文件
location /img/ {
    root /var/www/image;
}
#若按照这种配置的话，则访问/img/目录下的文件时，nginx会去/var/www/image/img/目录下找文件。
```

- location

```nginx
Syntax: location [ = | ~ | ~* | ^~ ] uri { ... }
	location @name { ... }
Default: -
Context: server, location
```

根据请求的URI设置配置。
在一个server中location配置段可存在多个，用于实现URI到文件系统的路径映射；

匹配字符串分为两种：普通字符串 (literal string) 和正则表达式 (regular expression) ，其中 ~ 和 ~* 用于正则表达式，其他前缀和无任何前缀都用于普通字符串。

**匹配顺序是**

1. 先匹配普通字符串，将相对最精确的匹配暂时存储；
2. 然后按照配置文件中的声明顺序进行正则表达式匹配，只要匹配到一条正则表达式，则停止匹配，取正则表达式为匹配结果;
3. 如果所有正则表达式都匹配不上,则取1中存储的结果；
4. 如果普通字符串和正则表达式都匹配不上，则报404 NOT FOUND
5. "^~ "和"="都能阻止继续搜索正则location。不同点是"^~“依然遵守"最大前缀"匹配规则，然而"="不是"最大前缀”，而是必须是严格匹配
6. 只要遇到"完全匹配（exact match[ɪɡˈzækt mætʃ]）"，即使普通location 没有带"="或"^~"前缀，也一样会终止后面的匹配。

例如:

```nginx
location = /uri		=开头表示精确前缀匹配，只有完全匹配才能生效。
location ^~ /uri	^~开头表示普通字符串匹配上以后不再进行正则匹配。
location ~ pattern	~开头表示区分大小写的正则匹配。
location ~* pattern	~*开头表示不区分大小写的正则匹配。
location /uri	不带任何修饰符，表示前缀匹配。
location /	通用匹配，任何未匹配到其他location的请求都会匹配到。
```

配置举例：

```nginx
location = / {
	[ configuration A ]
}

location / {
	[ configuration B ]
}

location /documents/ {
	[ configuration C ]
}

location ^~ /images/ {
	[ configuration D ]
}

location ~* \. (gif | jpg | jpeg)$ {
	[ configuration E ]
}
    
# "/"请求匹配configuration A:
# "/index.html"请求匹配configuration B:
# "/documents/document. . html"请求匹配configuration C:
# "/images/1.gif"请求匹配configuration D: 
# "/documents/1.jpg"请求匹配configuration E。

# 注意:正则匹配会根据匹配顺序，找到第一个匹配的正则表达式后将停止搜索。
# 普通字符串匹配则无视顺序，只会选择最精确的匹配。
```

- tcp_nodelay （delay  [dɪˈleɪ]  延迟）

```nginx
Syntax: tcp_nodelay on | off;
Default: tcp_nodelay on;
context: http, server, location
```

当连接转换为保持活动(keep-alive)状态时，启用该选项。此外，它在SSL连接、无缓冲代理和WebSocket代理上也要启用。（这个选项仅在将连接转变为长连接的时候才被启用。）（需要频繁的发送一些小包数据并且不希望放置缓冲区而是直接发送时开启）

- tcp_nopush（push [pʊʃ]）

```nginx
Syntax: tcp_nopush on | off;
Default: tcp_nopush off;
context: http, server, location
```

启用或禁FreeBSD上的tcp_nopush socket选项或Linux上的tcp_cork socket选项。只有在使用sendfile时才启用这些选项。（其功能和tcp_nodelay功能正好相反）

- senfile

```nginx
Syntax: sendfile on | off;
Default: sendfile off;
Context: http, server, location, if in location
```

启用或禁用sendfile()的使用。从nginx 0.8.12和FreeBSD 5.2.1开始，AIO（即Async非阻塞，是异步非阻塞的IO）可用于预加载sendfile()的数据。

不开启sendfile():
硬盘 >> kernel buffer >> user buffer >> kernel socket buffer >>协议栈

开启sendfile():
硬盘 >> kernel buffer (快速拷贝到ker nelsocket buffer) >>协议栈

当 Nginx是一个静态文件服务器的时候，开启sendfile配置项能大大提高Nginx的性能。

例如:

```nginx
location /video/ {
	sendfile	on;
	tcp_ nopush	on;
	aio		    on;
}
```

- server_tokens

```nginx
Syntax: server_tokens on | off | build | string;
Default: server_tokens on;
context: http, server, location
```

在错误页和”服务器”响应头字段中启用或禁用发出nginx版本。

- error_page

```nginx
Syntax: error_page code ... [=[response]] uri;
Default: -
Context: http, server, location, if in location
```

定义为指定错误显示的URI。URI值可以包含变量。

例如:

```nginx
error_page 404		/404.html;
error_page 500 502 503 504 /50x.html;

# 这将导致内部重定向到指定的URI,客户端请求方法更改为"GET" (对于除"GET"和"HEAD"之外的所有方法)。
# 此外，可以使用"=response"语法将响应代码更改为其他代码，例如:
ror_page 404 =200 /empty.gif;
```

- keepalive_timeout

```nginx
Syntax: keepalive_timeout timeout [header_timeout];
Default: keepalive_timeout 75s;
Context: http, server, location
```

设定客户端保持连接超时时长，0表示禁止。 Mozilla和Konqueror可以识别， MSIE自己会在60s后关闭连接。

Konqueror （孔克洛）是 KDE 桌面系统的一部分，主要用于 Linux 和 BSD家族的操作系统。在微软的 Windows 系统下，也有零星使用，当然功能相对有限。Konqueror主要用于文件管理、浏览，以及网页浏览。Konqueror 按照 GPL 进行发布。

- keepalive_requests

```nginx
Syntax: keepalive_requests number;
Default: keepalive_requests 100;
Context: http, server, location
```

设置通过一个保持活动连接可以提供服务的最大请求数。在发出最大请求数后，连接将关闭。

- keepalive_disable

```nginx
Syntax: keepalive_disable none | browser ...;
Default: keepalive_disab1e msie6;
Context: http, server, location
```

禁止与那些行为不正常的浏览器保持活动连接。

- send_timeout

```nginx
Syntax: send_timeout time;
Default: send_timeout 60s;
Context: http, server, location
```

设置向客户端发送响应的超时时间。超时仅在两个连续的写入操作之间设置，不用于传输整个响应。如果客户端在此时间内未收到任何内容，则连接将关闭。

- client_body_buffer_size

```nginx
Syntax: client_body_buffer_size size;
Default: client_body_buffer_size 8k |16k;
Context: http, server, location
```

设置读取客户端请求body部分的buffer大小。如果请求body大于缓冲区，则整个body或其部分将写入临时文件。默认情况下，缓冲区大小等于两个内存页。x86平台默认是8k，x86_ 64平台是16k。

- client_body_temp_path

```nginx
Syntax: client_body_temp_path path [1evel1 [1evel2 [leve13]]];
Default: client_body_temp_path client_body_temp;
Context: http, server, location
```

定义用于存储保存客户端请求body的临时文件的目录。指定目录下最多可以使用三级子目录层次结构。例如:

```nginx
# 这里的level1,2,3如果有值就代表存在一级，二级，三级子目录。
# 目录名是由数字进行命名的，所以这里的具体的值就是代表目录名的数字位数
client_body_temp_path /spoo1/nginx/client_temp 1 2;
# 临时文件的路径可能看起来像下面所示:
/spoo1/nginx/client_temp/7/45/00000123457
```

- client_max_body_size

```nginx
Syntax: client_max_body_size size;
Default: client_max_body_size 1m;
Context: http, server, location
```

设置客户端请求body部分的最大值。指定在请求头的"Content-Length"区域。 如果超出这个值，则返回413错误。将大小设置为0将禁用对客户端请求body大小的检查。

- limit_rate ([reɪt])

```nginx
Syntax: limit_rate rate;
Default: limit_rate 0;
context: http, server, location, if in location
```

限制响应给客户端的传输速率，单位是bytes/second,默认值0表示无限制。

- limit_except ( [ɪkˈsept] )

```nginx
syntax: limit_except method ... { ... }
Default: -
Context: location
```

限制在location内使用的http方法。方法包括: GET, HEAD, POST, PUT, DELETE, MKCOL, COPY, MOVE,OPTIONS, PROPFIND, PROPPATCH, LOCK, UNLOCK, PATCH。允许GET方法时, HEAD方法也会被允许。例如:

（allow [əˈlaʊ]   deny  [dɪˈnaɪ] ）

```nginx
limit_except GET {
	allow 192.168.1.0/24;
	deny all;
}
#除了GET和HEAD之外其它方法仅允许192.168.1.0/24网段主机使用
```

## 3，访问控制模块

此模块允许限制对特定客户机地址的访问

- allow

```nginx
Syntax: allow address | CIDR | unix: | all;
Default: -
Context: http, server, location, limit_except
```

指定允许访问的地址或网格

- deny

```nginx
Syntax: deny address | CIDR | unix: | a11;
Default: -
Context: http, server, location, limit_except
```

指定拒绝的地址或网络

例如:

```nginx
location / {
	deny 192.168.1.1;
	allow 192.168.1.0/24;
	allow 10.1.1.0/16;
	allow 2001:0db8::/32;
	deny all;
}
# 规则按顺序检查，直到找到第一个匹配项。
```

## 4、用户认证模块(ngx_ http_ _auth_ basic_ module)

此模块使用HTTP Basic Authentication协议限制对资源的访问，通过用户名和密码方式。

- auth_basic

```nginx
syntax: auth_basic string | off;
Default: auth_basic off;
Context: http, server, location, limit_except
```

激活和关闭认证功能。

- auth_basic_user_file

```nginx
Syntax: auth_basic_user_file file;
Default: -
Context: http, server, location, limit_except
```

指定保存用户名和密码的文件。格式如下:

```nginx
# comment
name1: password1
name2: password2:comment
name3: password3

# 也可以使用密文。可以通过使用apatch的htpasswd命令(http-tools提供)
# 或者openssl passwd命令
```

配置案例：

```nginx
location /admin/ {
	auth_basic "Admin Area";
	auth_basic_user_file /etc/nginx/.ngxpasswd;
}

location / {
	auth_basic	"closed site";
	auth_basic_user_file conf/htpasswd;
}
```

## 5、基本状态查看模块(ngx_http_stub_status_module)

提供对基本状态信息的访问

- stub_status

```nginx
Syntax: stub_status;
Default: -
Context: server, location
```

在1.7.5之前的版本:"stub_status on"。
配置案例:

```nginx
location = /basic_status {
	stub_status;
location /status {
	stub_status;
	allow 172.16.0.0/16;
	deny all;
}
# 输出nginx的基本状态信息
# Active connections:当前状态, 活动状态的连接数
# accepts: 统计总值, 已经接受的客户端请求的总数
# handled: 统计总值, 已经处理完成的客户端请求的总数
# requests: 统计总值, 客户端发来的总的请求数
# Reading: 当前状态, 正在读取客户端请求报文首部的连接的连接数
# writing: 当前状态, 正在向客户端发送响应报文过程中的连接数
# waiting: 当前状态, 正在等待客户端发出请求的空闲连接数
```

