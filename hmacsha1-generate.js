var urlencode = require('urlencode');
var base64 = require('base-64');


function GenerateSignature(key ,data){
    var data = urlencode(data);
    var hash = hmacsha1(key,data);
	  return base64.encode(hash);	
}

module.exports = {
  generateSignature : GenerateSignature
}

///////////////////////////////////////////////////////////// Core function to bulid a signature ////////////////////////////////////
function xor(a, b) {
  if (!Buffer.isBuffer(a)) a = new Buffer(a)
  if (!Buffer.isBuffer(b)) b = new Buffer(b)
  var res = []
  if (a.length > b.length) {
    for (var i = 0; i < b.length; i++) {
       res.push(a[i] ^ b[i])
    }
 } else {
 for (var i = 0; i < a.length; i++) {
   res.push(a[i] ^ b[i])
   }
 }
 return new Buffer(res);
}



function hmacsha1(secretAcessKey,signatureBase) { 
  var blocksize=64;
  var key = secretAcessKey;
  var data = signatureBase;

    var length = key.length;
    if (length > blocksize) {
        key=pack('H*', sha1(key));  
    }
    key=str_pad(key,blocksize,chr('0x00') ,'STR_PAD_RIGHT');
    ipad=str_repeat(chr('0x36'),blocksize);
    opad=str_repeat(chr('0x5c'),blocksize);
    var keyopad = xor(key,opad);
    var keyipad = xor(key,ipad);
    var sha1final = sha1(keyopad+pack('H*',sha1(keyipad+data)));
    hmac = pack('H*',sha1final); 
    return hmac;
}


////////////////////    Pack Function Start  ///////////////////////////////////
function pack (format) {
  var formatPointer = 0
  var argumentPointer = 1
  var result = ''
  var argument = ''
  var i = 0
  var r = []
  var instruction, quantifier, word, precisionBits, exponentBits, extraNullCount

  // vars used by float encoding
  var bias
  var minExp
  var maxExp
  var minUnnormExp
  var status
  var exp
  var len
  var bin
  var signal
  var n
  var intPart
  var floatPart
  var lastBit
  var rounded
  var j
  var k
  var tmpResult

  while (formatPointer < format.length) {
    instruction = format.charAt(formatPointer)
    quantifier = ''
    formatPointer++
    while ((formatPointer < format.length) && (format.charAt(formatPointer)
        .match(/[\d\*]/) !== null)) {
      quantifier += format.charAt(formatPointer)
      formatPointer++
    }
    if (quantifier === '') {
      quantifier = '1'
    }

    // Now pack variables: 'quantifier' times 'instruction'
    switch (instruction) {
      case 'a':
      case 'A':
        // NUL-padded string
        // SPACE-padded string
        if (typeof arguments[argumentPointer] === 'undefined') {
          throw new Error('Warning:  pack() Type ' + instruction + ': not enough arguments')
        } else {
          argument = String(arguments[argumentPointer])
        }
        if (quantifier === '*') {
          quantifier = argument.length
        }
        for (i = 0; i < quantifier; i++) {
          if (typeof argument[i] === 'undefined') {
            if (instruction === 'a') {
              result += String.fromCharCode(0)
            } else {
              result += ' '
            }
          } else {
            result += argument[i]
          }
        }
        argumentPointer++
        break
      case 'h':
      case 'H':
        // Hex string, low nibble first
        // Hex string, high nibble first
        if (typeof arguments[argumentPointer] === 'undefined') {
          throw new Error('Warning: pack() Type ' + instruction + ': not enough arguments')
        } else {
          argument = arguments[argumentPointer]
        }
        if (quantifier === '*') {
          quantifier = argument.length
        }
        if (quantifier > argument.length) {
          var msg = 'Warning: pack() Type ' + instruction + ': not enough characters in string'
          throw new Error(msg)
        }

        for (i = 0; i < quantifier; i += 2) {
          // Always get per 2 bytes...
          word = argument[i]
          if (((i + 1) >= quantifier) || typeof argument[i + 1] === 'undefined') {
            word += '0'
          } else {
            word += argument[i + 1]
          }
          // The fastest way to reverse?
          if (instruction === 'h') {
            word = word[1] + word[0]
          }
          result += String.fromCharCode(parseInt(word, 16))
        }
        argumentPointer++
        break

      case 'c':
      case 'C':
        // signed char
        // unsigned char
        // c and C is the same in pack
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }

        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer])
          argumentPointer++
        }
        break

      case 's':
      case 'S':
      case 'v':
        // signed short (always 16 bit, machine byte order)
        // unsigned short (always 16 bit, machine byte order)
        // s and S is the same in pack
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }

        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          argumentPointer++
        }
        break

      case 'n':
        // unsigned short (always 16 bit, big endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning: pack() Type ' + instruction + ': too few arguments')
        }

        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          argumentPointer++
        }
        break

      case 'i':
      case 'I':
      case 'l':
      case 'L':
      case 'V':
        // signed integer (machine dependent size and byte order)
        // unsigned integer (machine dependent size and byte order)
        // signed long (always 32 bit, machine byte order)
        // unsigned long (always 32 bit, machine byte order)
        // unsigned long (always 32 bit, little endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }

        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF)
          argumentPointer++
        }

        break
      case 'N':
        // unsigned long (always 32 bit, big endian byte order)
        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }

        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF)
          result += String.fromCharCode(arguments[argumentPointer] & 0xFF)
          argumentPointer++
        }
        break

      case 'f':
      case 'd':
        // float (machine dependent size and representation)
        // double (machine dependent size and representation)
        // version based on IEEE754
        precisionBits = 23
        exponentBits = 8
        if (instruction === 'd') {
          precisionBits = 52
          exponentBits = 11
        }

        if (quantifier === '*') {
          quantifier = arguments.length - argumentPointer
        }
        if (quantifier > (arguments.length - argumentPointer)) {
          throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments')
        }
        for (i = 0; i < quantifier; i++) {
          argument = arguments[argumentPointer]
          bias = Math.pow(2, exponentBits - 1) - 1
          minExp = -bias + 1
          maxExp = bias
          minUnnormExp = minExp - precisionBits
          status = isNaN(n = parseFloat(argument)) || n === -Infinity || n === +Infinity ? n : 0
          exp = 0
          len = 2 * bias + 1 + precisionBits + 3
          bin = new Array(len)
          signal = (n = status !== 0 ? 0 : n) < 0
          n = Math.abs(n)
          intPart = Math.floor(n)
          floatPart = n - intPart

          for (k = len; k;) {
            bin[--k] = 0
          }
          for (k = bias + 2; intPart && k;) {
            bin[--k] = intPart % 2
            intPart = Math.floor(intPart / 2)
          }
          for (k = bias + 1; floatPart > 0 && k; --floatPart) {
            (bin[++k] = ((floatPart *= 2) >= 1) - 0)
          }
          for (k = -1; ++k < len && !bin[k];) {}

          // @todo: Make this more readable:
          var key = (lastBit = precisionBits - 1 +
            (k =
              (exp = bias + 1 - k) >= minExp &&
              exp <= maxExp ? k + 1 : bias + 1 - (exp = minExp - 1))) + 1

          if (bin[key]) {
            if (!(rounded = bin[lastBit])) {
              for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]) {}
            }
            for (j = lastBit + 1; rounded && --j >= 0;
            (bin[j] = !bin[j] - 0) && (rounded = 0)) {}
          }

          for (k = k - 2 < 0 ? -1 : k - 3; ++k < len && !bin[k];) {}

          if ((exp = bias + 1 - k) >= minExp && exp <= maxExp) {
            ++k
          } else {
            if (exp < minExp) {
              if (exp !== bias + 1 - len && exp < minUnnormExp) {
                // "encodeFloat::float underflow"
              }
              k = bias + 1 - (exp = minExp - 1)
            }
          }

          if (intPart || status !== 0) {
            exp = maxExp + 1
            k = bias + 2
            if (status === -Infinity) {
              signal = 1
            } else if (isNaN(status)) {
              bin[k] = 1
            }
          }

          n = Math.abs(exp + bias)
          tmpResult = ''

          for (j = exponentBits + 1; --j;) {
            tmpResult = (n % 2) + tmpResult
            n = n >>= 1
          }

          n = 0
          j = 0
          k = (tmpResult = (signal ? '1' : '0') + tmpResult + (bin
            .slice(k, k + precisionBits)
            .join(''))
          ).length
          r = []

          for (; k;) {
            n += (1 << j) * tmpResult.charAt(--k)
            if (j === 7) {
              r[r.length] = String.fromCharCode(n)
              n = 0
            }
            j = (j + 1) % 8
          }

          r[r.length] = n ? String.fromCharCode(n) : ''
          result += r.join('')
          argumentPointer++
        }
        break

      case 'x':
        // NUL byte
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type x: \'*\' ignored')
        }
        for (i = 0; i < quantifier; i++) {
          result += String.fromCharCode(0)
        }
        break

      case 'X':
        // Back up one byte
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type X: \'*\' ignored')
        }
        for (i = 0; i < quantifier; i++) {
          if (result.length === 0) {
            throw new Error('Warning: pack(): Type X:' + ' outside of string')
          } else {
            result = result.substring(0, result.length - 1)
          }
        }
        break

      case '@':
        // NUL-fill to absolute position
        if (quantifier === '*') {
          throw new Error('Warning: pack(): Type X: \'*\' ignored')
        }
        if (quantifier > result.length) {
          extraNullCount = quantifier - result.length
          for (i = 0; i < extraNullCount; i++) {
            result += String.fromCharCode(0)
          }
        }
        if (quantifier < result.length) {
          result = result.substring(0, quantifier)
        }
        break

      default:
        throw new Error('Warning: pack() Type ' + instruction + ': unknown format code')
    }
  }
  if (argumentPointer < arguments.length) {
    var msg2 = 'Warning: pack(): ' + (arguments.length - argumentPointer) + ' arguments unused'
    throw new Error(msg2)
  }

  return result
}

////////////////////    Pack Function End  ///////////////////////////////////



//////////////////////// sha1 funtion start //////////////////////////////////
function sha1 (str) {
  //  discuss at: http://locutus.io/php/sha1/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Michael White (http://getsprink.com)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  //    input by: Brett Zamir (http://brett-zamir.me)
  //      note 1: Keep in mind that in accordance with PHP, the whole string is buffered and then
  //      note 1: hashed. If available, we'd recommend using Node's native crypto modules directly
  //      note 1: in a steaming fashion for faster and more efficient hashing
  //   example 1: sha1('Kevin van Zonneveld')
  //   returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

  var hash
  try {
    var crypto = require('crypto')
    var sha1sum = crypto.createHash('sha1')
    sha1sum.update(str)
    hash = sha1sum.digest('hex')
  } catch (e) {
    hash = undefined
  }

  if (hash !== undefined) {
    return hash
  }

  var _rotLeft = function (n, s) {
    var t4 = (n << s) | (n >>> (32 - s))
    return t4
  }

  var _cvtHex = function (val) {
    var str = ''
    var i
    var v

    for (i = 7; i >= 0; i--) {
      v = (val >>> (i * 4)) & 0x0f
      str += v.toString(16)
    }
    return str
  }

  var blockstart
  var i, j
  var W = new Array(80)
  var H0 = 0x67452301
  var H1 = 0xEFCDAB89
  var H2 = 0x98BADCFE
  var H3 = 0x10325476
  var H4 = 0xC3D2E1F0
  var A, B, C, D, E
  var temp

  // utf8_encode
  str = unescape(encodeURIComponent(str))
  var strLen = str.length

  var wordArray = []
  for (i = 0; i < strLen - 3; i += 4) {
    j = str.charCodeAt(i) << 24 |
      str.charCodeAt(i + 1) << 16 |
      str.charCodeAt(i + 2) << 8 |
      str.charCodeAt(i + 3)
    wordArray.push(j)
  }

  switch (strLen % 4) {
    case 0:
      i = 0x080000000
      break
    case 1:
      i = str.charCodeAt(strLen - 1) << 24 | 0x0800000
      break
    case 2:
      i = str.charCodeAt(strLen - 2) << 24 | str.charCodeAt(strLen - 1) << 16 | 0x08000
      break
    case 3:
      i = str.charCodeAt(strLen - 3) << 24 |
        str.charCodeAt(strLen - 2) << 16 |
        str.charCodeAt(strLen - 1) <<
      8 | 0x80
      break
  }

  wordArray.push(i)

  while ((wordArray.length % 16) !== 14) {
    wordArray.push(0)
  }

  wordArray.push(strLen >>> 29)
  wordArray.push((strLen << 3) & 0x0ffffffff)

  for (blockstart = 0; blockstart < wordArray.length; blockstart += 16) {
    for (i = 0; i < 16; i++) {
      W[i] = wordArray[blockstart + i]
    }
    for (i = 16; i <= 79; i++) {
      W[i] = _rotLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
    }

    A = H0
    B = H1
    C = H2
    D = H3
    E = H4

    for (i = 0; i <= 19; i++) {
      temp = (_rotLeft(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 20; i <= 39; i++) {
      temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 40; i <= 59; i++) {
      temp = (_rotLeft(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    for (i = 60; i <= 79; i++) {
      temp = (_rotLeft(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff
      E = D
      D = C
      C = _rotLeft(B, 30)
      B = A
      A = temp
    }

    H0 = (H0 + A) & 0x0ffffffff
    H1 = (H1 + B) & 0x0ffffffff
    H2 = (H2 + C) & 0x0ffffffff
    H3 = (H3 + D) & 0x0ffffffff
    H4 = (H4 + E) & 0x0ffffffff
  }

  temp = _cvtHex(H0) + _cvtHex(H1) + _cvtHex(H2) + _cvtHex(H3) + _cvtHex(H4)
  return temp.toLowerCase()
}




/////////////////////   sha1 function end ////////////////////////////////////




//////////////////// string_pad function start ////////////////////////////////
function str_pad (input, padLength, padString, padType) { // eslint-disable-line camelcase
  //  discuss at: http://locutus.io/php/str_pad/
  // original by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Michael White (http://getsprink.com)
  //    input by: Marco van Oort
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //   example 1: str_pad('Kevin van Zonneveld', 30, '-=', 'STR_PAD_LEFT')
  //   returns 1: '-=-=-=-=-=-Kevin van Zonneveld'
  //   example 2: str_pad('Kevin van Zonneveld', 30, '-', 'STR_PAD_BOTH')
  //   returns 2: '------Kevin van Zonneveld-----'

  var half = ''
  var padToGo

  var _strPadRepeater = function (s, len) {
    var collect = ''

    while (collect.length < len) {
      collect += s
    }
    collect = collect.substr(0, len)

    return collect
  }

  input += ''
  padString = padString !== undefined ? padString : ' '

  if (padType !== 'STR_PAD_LEFT' && padType !== 'STR_PAD_RIGHT' && padType !== 'STR_PAD_BOTH') {
    padType = 'STR_PAD_RIGHT'
  }
  if ((padToGo = padLength - input.length) > 0) {
    if (padType === 'STR_PAD_LEFT') {
      input = _strPadRepeater(padString, padToGo) + input
    } else if (padType === 'STR_PAD_RIGHT') {
      input = input + _strPadRepeater(padString, padToGo)
    } else if (padType === 'STR_PAD_BOTH') {
      half = _strPadRepeater(padString, Math.ceil(padToGo / 2))
      input = half + input + half
      input = input.substr(0, padLength)
    }
  }

  return input
}



//////////////////  string_pad end ////////////////////////////////////////////


//////////////// string_repeat  start ////////////////////////////////////////
function str_repeat (input, multiplier) { // eslint-disable-line camelcase
  //  discuss at: http://locutus.io/php/str_repeat/
  // original by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // improved by: Ian Carter (http://euona.com/)
  //   example 1: str_repeat('-=', 10)
  //   returns 1: '-=-=-=-=-=-=-=-=-=-='

  var y = ''
  while (true) {
    if (multiplier & 1) {
      y += input
    }
    multiplier >>= 1
    if (multiplier) {
      input += input
    } else {
      break
    }
  }
  return y
}


/////////////// string_repeat end //////////////////////////////////////////////



//////////////// chr function start ////////////////////////////////////////////
function chr (codePt) {
  //  discuss at: http://locutus.io/php/chr/
  // original by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //   example 1: chr(75) === 'K'
  //   example 1: chr(65536) === '\uD800\uDC00'
  //   returns 1: true
  //   returns 1: true

  if (codePt > 0xFFFF) { // Create a four-byte string (length 2) since this code point is high
    //   enough for the UTF-16 encoding (JavaScript internal use), to
    //   require representation with two surrogates (reserved non-characters
    //   used for building other characters; the first is "high" and the next "low")
    codePt -= 0x10000
    return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF))
  }
  return String.fromCharCode(codePt)
}



/////////////// char function end //////////////////////////////////////////////
