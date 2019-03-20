using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace {{.dotnet.namespace}}.Controllers
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        // GET health
        [HttpGet]
        public ActionResult<string> Get()
        {
            return "OK";
        }
    }
}
